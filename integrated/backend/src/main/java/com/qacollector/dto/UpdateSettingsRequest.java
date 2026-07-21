package com.qacollector.dto;

import lombok.Data;

@Data
public class UpdateSettingsRequest {
    private Integer quizQuestionCount;
    private String paymentMode;
    private Boolean la51Enabled;
    private String la51SiteId;
    private String la51Ck;
    private Boolean facebookPixelEnabled;
    private String facebookPixelId;
    private Boolean facebookCapiEnabled;
    private String facebookCapiAccessToken;
    private String facebookCapiTestEventCode;
    private String facebookCapiApiVersion;
}
