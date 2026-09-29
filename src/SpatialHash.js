export class SpatialHash {
  constructor(cell) {
    this.cell = cell;
    this.buckets = new Map();
    this.pool = [];
  }

  rebuild(pos, count) {
    const buckets = this.buckets;
    const pool = this.pool;
    for (const list of buckets.values()) {
      list.length = 0;
      pool.push(list);
    }
    buckets.clear();
    const cell = this.cell;
    for (let i = 0; i < count; i++) {
      const cx = Math.floor(pos[i * 2] / cell);
      const cy = Math.floor(pos[i * 2 + 1] / cell);
      const k = `${cx},${cy}`;
      let list = buckets.get(k);
      if (!list) {
        list = pool.pop() ?? [];
        buckets.set(k, list);
      }
      list.push(i);
    }
  }

  queryAABB(aabb, pos, visit) {
    const cell = this.cell;
    const lx = aabb.lowerBound.x;
    const ly = aabb.lowerBound.y;
    const ux = aabb.upperBound.x;
    const uy = aabb.upperBound.y;
    const x0 = Math.floor(lx / cell);
    const y0 = Math.floor(ly / cell);
    const x1 = Math.floor(ux / cell);
    const y1 = Math.floor(uy / cell);
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const list = this.buckets.get(`${cx},${cy}`);
        if (!list) continue;
        for (let n = 0; n < list.length; n++) {
          const i = list[n];
          const x = pos[i * 2];
          const y = pos[i * 2 + 1];
          if (x < lx || x > ux || y < ly || y > uy) continue;
          visit(i);
        }
      }
    }
  }
}
