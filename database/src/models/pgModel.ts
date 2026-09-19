import { executeQuery } from "../config/db.js";

function getNestedValue(obj: any, path: string): any {
  if (!obj || typeof obj !== "object") return undefined;
  const parts = path.split(".");
  let curr = obj;
  for (const part of parts) {
    if (curr === null || curr === undefined) return undefined;
    if (part === "__proto__" || part === "constructor" || part === "prototype") continue;
    curr = curr[part];
  }
  return curr;
}

export function matchesFilter(doc: any, filter: any): boolean {
  if (!filter || typeof filter !== "object" || Object.keys(filter).length === 0) {
    return true;
  }

  if (Array.isArray(filter.$or)) {
    const orMatches = filter.$or.some((subFilter: any) => matchesFilter(doc, subFilter));
    if (!orMatches) return false;
  }

  for (const key of Object.keys(filter)) {
    if (key === "$or" || key === "__proto__" || key === "constructor" || key === "prototype") continue;

    const expected = filter[key];
    const actual = getNestedValue(doc, key);

    if (expected instanceof RegExp) {
      if (!expected.test(String(actual ?? ""))) {
        return false;
      }
    } else if (expected && typeof expected === "object" && !(expected instanceof Date) && !Array.isArray(expected)) {
      if (expected.$in && Array.isArray(expected.$in)) {
        if (!expected.$in.includes(actual)) return false;
      } else if (expected.$ne !== undefined) {
        if (actual === expected.$ne) return false;
      } else {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) return false;
      }
    } else {
      if (actual != expected) {
        if (typeof actual === "string" && typeof expected === "string") {
          if (actual.toLowerCase() !== expected.toLowerCase()) return false;
        } else {
          return false;
        }
      }
    }
  }

  return true;
}

export class PgQueryBuilder<T = any> implements PromiseLike<T[]> {
  private tableName: string;
  private filter: any;
  private sortObj: any = null;
  private limitNum: number | null = null;
  private model: PgModel;

  constructor(tableName: string, filter: any = {}, model: PgModel) {
    this.tableName = tableName;
    this.filter = filter;
    this.model = model;
  }

  sort(sortObj: any): this {
    this.sortObj = sortObj;
    return this;
  }

  limit(limitNum: number): this {
    this.limitNum = limitNum;
    return this;
  }

  lean(): this {
    return this;
  }

  private async fetchResults(): Promise<T[]> {
    const rows = await executeQuery(`SELECT data FROM ${this.tableName}`);
    let results = rows.map((r: any) => (typeof r.data === "string" ? JSON.parse(r.data) : r.data));

    if (this.filter && Object.keys(this.filter).length > 0) {
      results = results.filter((doc: any) => matchesFilter(doc, this.filter));
    }

    if (this.sortObj) {
      const keys = Object.keys(this.sortObj);
      if (keys.length > 0) {
        const sortKey = keys[0];
        const dir = this.sortObj[sortKey] === -1 || this.sortObj[sortKey] === "desc" ? -1 : 1;
        results.sort((a: any, b: any) => {
          const valA = getNestedValue(a, sortKey) ?? a.createdAt ?? a.created_at ?? "";
          const valB = getNestedValue(b, sortKey) ?? b.createdAt ?? b.created_at ?? "";
          if (valA < valB) return -1 * dir;
          if (valA > valB) return 1 * dir;
          return 0;
        });
      }
    }

    if (this.limitNum !== null && this.limitNum >= 0) {
      results = results.slice(0, this.limitNum);
    }

    return results.map((doc: any) => this.model.attachSave(doc));
  }

  then<TResult1 = T[], TResult2 = never>(
    onfulfilled?: ((value: T[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.fetchResults().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<T[] | TResult> {
    return this.fetchResults().catch(onrejected);
  }
}

export class PgModel<T = any> {
  public tableName: string;

  constructor(tableName: string) {
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      throw new Error(`[PgModel] Invalid table identifier: ${tableName}`);
    }
    this.tableName = tableName;
  }

  public attachSave(doc: any): any {
    if (doc && typeof doc === "object" && !Object.prototype.hasOwnProperty.call(doc, "save")) {
      const self = this;
      Object.defineProperty(doc, "save", {
        enumerable: false,
        writable: true,
        value: async function () {
          await self.create(doc);
          return doc;
        }
      });
    }
    return doc;
  }

  find(filter: any = {}): PgQueryBuilder<T> {
    return new PgQueryBuilder<T>(this.tableName, filter, this);
  }

  async findOne(filter: any = {}): Promise<T | null> {
    const results = await new PgQueryBuilder<T>(this.tableName, filter, this).limit(1);
    return results.length > 0 ? results[0] : null;
  }

  async create(docs: any): Promise<any> {
    const isArray = Array.isArray(docs);
    const docList = isArray ? docs : [docs];
    const insertedDocs: any[] = [];

    for (const rawDoc of docList) {
      const doc = { ...rawDoc };
      const id = String(doc.id || doc.loanNo || doc.receiptNo || doc.sessionId || doc.key || `id-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
      doc.id = id;

      const now = new Date().toISOString();
      if (!doc.createdAt) doc.createdAt = now;
      if (!doc.updatedAt) doc.updatedAt = now;

      const dataJson = JSON.stringify(doc);
      await executeQuery(
        `INSERT INTO ${this.tableName} (id, data, created_at, updated_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = $4`,
        [id, dataJson, doc.createdAt, doc.updatedAt]
      );

      insertedDocs.push(this.attachSave(doc));
    }

    return isArray ? insertedDocs : insertedDocs[0];
  }

  async findOneAndUpdate(filter: any, update: any, options: { new?: boolean; upsert?: boolean } = { new: true }): Promise<T | null> {
    let existing = await this.findOne(filter);
    if (!existing && options && options.upsert) {
      existing = filter as any;
    }
    if (!existing) {
      return null;
    }

    const docId = (existing as any).id || (filter as any).id || (filter as any).key;
    let updatedDoc: any = { ...(existing as any) };

    if (update.$set) {
      updatedDoc = { ...updatedDoc, ...update.$set };
    } else {
      updatedDoc = { ...updatedDoc, ...update };
    }

    if (!updatedDoc.id) {
      updatedDoc.id = docId || `id-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    }

    updatedDoc.updatedAt = new Date().toISOString();

    const dataJson = JSON.stringify(updatedDoc);
    await executeQuery(
      `INSERT INTO ${this.tableName} (id, data, created_at, updated_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = $4`,
      [updatedDoc.id, dataJson, updatedDoc.createdAt || updatedDoc.updatedAt, updatedDoc.updatedAt]
    );

    return this.attachSave(updatedDoc) as T;
  }

  async findOneAndDelete(filter: any): Promise<T | null> {
    const existing = await this.findOne(filter);
    if (!existing) {
      return null;
    }

    const docId = (existing as any).id;
    await executeQuery(`DELETE FROM ${this.tableName} WHERE id = $1`, [docId]);
    return existing;
  }

  async countDocuments(filter: any = {}): Promise<number> {
    const results = await new PgQueryBuilder<T>(this.tableName, filter, this);
    return results.length;
  }
}
