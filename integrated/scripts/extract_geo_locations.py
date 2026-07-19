#!/usr/bin/env python3
"""从 lifeblueprintlibrary SQL 提取全球省市区地址数据，生成 geo_locations 导入脚本。"""

import re
import sys
from pathlib import Path

SOURCE = Path(r"c:\Users\liuziqi\Desktop\海外地址数据库\项目前后端\lifeblueprintlibrary(2).sql")
OUTPUT_SCHEMA = Path(__file__).resolve().parent.parent / "backend" / "src" / "main" / "resources" / "sql" / "geo_locations_schema.sql"
OUTPUT_DATA = Path(__file__).resolve().parent.parent / "backend" / "src" / "main" / "resources" / "sql" / "geo_locations_data.sql"

INSERT_RE = re.compile(
    r"INSERT INTO `erdai_api_weather_static_heweather` VALUES \((\d+), '((?:[^'\\]|\\.)*)', "
    r"'((?:[^'\\]|\\.)*)', '((?:[^'\\]|\\.)*)', '((?:[^'\\]|\\.)*)', '((?:[^'\\]|\\.)*)', (NULL|'(?:[^'\\]|\\.)*')\);"
)


def unescape(s: str) -> str:
    return s.replace("\\'", "'").replace("\\\\", "\\")


def parse_province(prov_raw: str | None) -> str | None:
    if not prov_raw or prov_raw == "NULL":
        return None
    prov = unescape(prov_raw.strip("'"))
    if "\t" in prov:
        return prov.split("\t")[0].strip()
    return prov.strip() or None


def estimate_timezone(lng: float, country: str) -> int:
    if country == "中国":
        return 8
    return max(-12, min(14, round(lng / 15)))


def should_include(location_code: str) -> bool:
    # 排除景区/景点类扩展编码（以 A 结尾）
    if location_code.endswith("A"):
        return False
    return True


def sql_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "''")


def main() -> int:
    if not SOURCE.exists():
        print(f"源文件不存在: {SOURCE}", file=sys.stderr)
        return 1

    text = SOURCE.read_text(encoding="utf-8")
    rows = []
    skipped = 0

    for m in INSERT_RE.finditer(text):
        mid = int(m.group(1))
        city = unescape(m.group(2))
        country = unescape(m.group(3))
        location_code = unescape(m.group(4))
        lat = float(m.group(5))
        lng = float(m.group(6))
        province = parse_province(m.group(7))

        if not should_include(location_code):
            skipped += 1
            continue

        tz = estimate_timezone(lng, country)
        rows.append((mid, country, province, city, location_code, lat, lng, tz))

    schema_sql = """-- 全球省市区地址表（由 scripts/extract_geo_locations.py 生成）
CREATE TABLE IF NOT EXISTS geo_locations (
  id INT NOT NULL PRIMARY KEY,
  country VARCHAR(100) NOT NULL,
  province VARCHAR(128) NULL,
  city VARCHAR(100) NOT NULL,
  location_code VARCHAR(50) NOT NULL,
  latitude DECIMAL(10, 6) NOT NULL,
  longitude DECIMAL(10, 6) NOT NULL,
  timezone INT NOT NULL DEFAULT 8,
  INDEX idx_geo_country (country),
  INDEX idx_geo_province (country, province),
  INDEX idx_geo_city (city),
  INDEX idx_geo_search (country, province, city),
  FULLTEXT INDEX ft_geo_search (country, province, city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

    OUTPUT_SCHEMA.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_SCHEMA.write_text(schema_sql, encoding="utf-8")

    batch_size = 500
    data_parts = [
        "-- 全球地址数据（排除景区景点编码）\n",
        "SET NAMES utf8mb4;\n",
        "SET FOREIGN_KEY_CHECKS = 0;\n",
        "TRUNCATE TABLE geo_locations;\n",
    ]

    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        values = []
        for mid, country, province, city, code, lat, lng, tz in batch:
            prov_sql = "NULL" if province is None else f"'{sql_escape(province)}'"
            values.append(
                f"({mid}, '{sql_escape(country)}', {prov_sql}, '{sql_escape(city)}', "
                f"'{sql_escape(code)}', {lat:.6f}, {lng:.6f}, {tz})"
            )
        data_parts.append("INSERT INTO geo_locations (id, country, province, city, location_code, latitude, longitude, timezone) VALUES\n")
        data_parts.append(",\n".join(values))
        data_parts.append(";\n")

    data_parts.append("SET FOREIGN_KEY_CHECKS = 1;\n")
    OUTPUT_DATA.write_text("".join(data_parts), encoding="utf-8")

    print(f"提取完成: {len(rows)} 条记录, 跳过景区 {skipped} 条")
    print(f"Schema: {OUTPUT_SCHEMA}")
    print(f"Data:   {OUTPUT_DATA}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
