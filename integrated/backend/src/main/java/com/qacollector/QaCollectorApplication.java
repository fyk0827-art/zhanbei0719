package com.qacollector;

import com.lifeblueprint.config.AlipayProperties;
import com.lifeblueprint.config.PaymentProperties;
import com.lifeblueprint.config.WechatPayProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = {"com.qacollector", "com.lifeblueprint"})
@EnableConfigurationProperties({PaymentProperties.class, AlipayProperties.class, WechatPayProperties.class})
@EnableScheduling
public class QaCollectorApplication {
    public static void main(String[] args) {
        SpringApplication.run(QaCollectorApplication.class, args);
    }
}
