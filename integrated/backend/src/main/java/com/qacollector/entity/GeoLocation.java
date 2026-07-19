package com.qacollector.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "geo_locations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GeoLocation {
    @Id
    private Integer id;

    @Column(nullable = false, length = 100)
    private String country;

    @Column(length = 128)
    private String province;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(name = "location_code", nullable = false, length = 50)
    private String locationCode;

    @Column(nullable = false, precision = 10, scale = 6)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 10, scale = 6)
    private BigDecimal longitude;

    @Column(nullable = false)
    private Integer timezone;
}
