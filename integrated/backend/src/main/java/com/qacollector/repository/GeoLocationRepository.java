package com.qacollector.repository;

import com.qacollector.entity.GeoLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GeoLocationRepository extends JpaRepository<GeoLocation, Integer> {

    @Query("SELECT DISTINCT g.country FROM GeoLocation g ORDER BY g.country")
    List<String> findDistinctCountries();

    @Query("SELECT DISTINCT g.province FROM GeoLocation g WHERE g.country = :country AND g.province IS NOT NULL ORDER BY g.province")
    List<String> findDistinctProvincesByCountry(@Param("country") String country);

    @Query("""
        SELECT g FROM GeoLocation g
        WHERE g.country = :country
          AND (:province IS NULL OR g.province = :province)
        ORDER BY g.city
        """)
    List<GeoLocation> findByCountryAndProvince(
        @Param("country") String country,
        @Param("province") String province
    );

    @Query(value = """
        SELECT * FROM geo_locations
        WHERE country LIKE CONCAT('%', :keyword, '%')
           OR province LIKE CONCAT('%', :keyword, '%')
           OR city LIKE CONCAT('%', :keyword, '%')
        ORDER BY
          CASE
            WHEN city = :keyword THEN 0
            WHEN city LIKE CONCAT(:keyword, '%') THEN 1
            WHEN province = :keyword THEN 2
            WHEN country = :keyword THEN 3
            ELSE 4
          END,
          country, province, city
        LIMIT :limit
        """, nativeQuery = true)
    List<GeoLocation> searchByKeyword(@Param("keyword") String keyword, @Param("limit") int limit);
}
