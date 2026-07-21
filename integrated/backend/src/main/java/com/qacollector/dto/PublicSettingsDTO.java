package com.qacollector.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PublicSettingsDTO {
    private int quizQuestionCount;
    private BigDecimal reportPrice;
    private boolean la51Enabled;
    private String la51SiteId;
    private String la51Ck;
    private boolean facebookPixelEnabled;
    private String facebookPixelId;
}
