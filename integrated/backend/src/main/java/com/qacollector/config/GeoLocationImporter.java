package com.qacollector.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class GeoLocationImporter implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'geo_locations'",
            Integer.class
        );
        if (count == null || count == 0) {
            log.info("创建 geo_locations 表...");
            executeSqlResource("sql/geo_locations_schema.sql");
        }

        Long rowCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM geo_locations", Long.class);
        if (rowCount != null && rowCount > 0) {
            log.info("geo_locations 已有 {} 条数据，跳过导入", rowCount);
            return;
        }

        log.info("开始导入全球地址数据（约 7.6 万条，首次启动可能需要 1-2 分钟）...");
        long start = System.currentTimeMillis();
        executeSqlResource("sql/geo_locations_data.sql");
        Long imported = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM geo_locations", Long.class);
        log.info("全球地址数据导入完成: {} 条, 耗时 {} ms", imported, System.currentTimeMillis() - start);
    }

    private void executeSqlResource(String path) throws Exception {
        ClassPathResource resource = new ClassPathResource(path);
        StringBuilder buffer = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
            new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("--")) {
                    continue;
                }
                buffer.append(line).append('\n');
                if (trimmed.endsWith(";")) {
                    String sql = buffer.toString().trim();
                    buffer.setLength(0);
                    if (!sql.isEmpty()) {
                        jdbcTemplate.execute(sql);
                    }
                }
            }
        }
    }
}
