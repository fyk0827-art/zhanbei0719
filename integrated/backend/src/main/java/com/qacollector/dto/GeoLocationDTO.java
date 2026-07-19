package com.qacollector.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GeoLocationDTO {
    private Integer id;
    private String country;
    private String province;
    private String city;
    private String locationCode;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer timezone;
    private String label;
}
