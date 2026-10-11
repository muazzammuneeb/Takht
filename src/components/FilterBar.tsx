"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function FilterBar({ categories, cities }: { categories: readonly string[]; cities: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function set(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <form className="filters" onSubmit={(e) => e.preventDefault()}>
      <div>
        <label htmlFor="f-category">Category</label>
        <select id="f-category" value={params.get("category") ?? ""} onChange={(e) => set("category", e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-city">City</label>
        <select id="f-city" value={params.get("city") ?? ""} onChange={(e) => set("city", e.target.value)}>
          <option value="">All of Pakistan</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </form>
  );
}
