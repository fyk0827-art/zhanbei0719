package com.qacollector.service;

import com.qacollector.dto.GeoLocationDTO;
import com.qacollector.entity.GeoLocation;
import com.qacollector.repository.GeoLocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GeoLocationService {

    private final GeoLocationRepository geoLocationRepository;

    public List<String> listCountries() {
        return geoLocationRepository.findDistinctCountries();
    }

    public List<String> listProvinces(String country) {
        return geoLocationRepository.findDistinctProvincesByCountry(country);
    }

    public List<GeoLocationDTO> listCities(String country, String province) {
        return geoLocationRepository.findByCountryAndProvince(country, province)
            .stream()
            .map(this::toDto)
            .toList();
    }

    public List<GeoLocationDTO> search(String keyword, int limit) {
        String q = keyword == null ? "" : keyword.trim();
        if (q.isEmpty()) {
            return List.of();
        }
        int safeLimit = Math.min(Math.max(limit, 1), 50);
        return geoLocationRepository.searchByKeyword(q, safeLimit)
            .stream()
            .map(this::toDto)
            .toList();
    }

    public GeoLocationDTO getById(int id) {
        return geoLocationRepository.findById(id)
            .map(this::toDto)
            .orElse(null);
    }

    private GeoLocationDTO toDto(GeoLocation g) {
        GeoLocationDTO dto = new GeoLocationDTO();
        dto.setId(g.getId());
        dto.setCountry(g.getCountry());
        dto.setProvince(g.getProvince());
        dto.setCity(g.getCity());
        dto.setLocationCode(g.getLocationCode());
        dto.setLatitude(g.getLatitude());
        dto.setLongitude(g.getLongitude());
        dto.setTimezone(g.getTimezone());
        dto.setLabel(buildLabel(g));
        return dto;
    }

    private String buildLabel(GeoLocation g) {
        if (g.getProvince() != null && !g.getProvince().isBlank()) {
            if ("中国".equals(g.getCountry())) {
                return g.getProvince() + " · " + g.getCity();
            }
            return g.getCountry() + " · " + g.getProvince() + " · " + g.getCity();
        }
        return g.getCountry() + " · " + g.getCity();
    }
}
