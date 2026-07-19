package com.qacollector.controller;

import com.qacollector.dto.ApiResponse;
import com.qacollector.dto.GeoLocationDTO;
import com.qacollector.service.GeoLocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/geo")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class GeoLocationController {

    private final GeoLocationService geoLocationService;

    @GetMapping("/countries")
    public ApiResponse<List<String>> countries() {
        return ApiResponse.ok(geoLocationService.listCountries());
    }

    @GetMapping("/provinces")
    public ApiResponse<List<String>> provinces(@RequestParam String country) {
        return ApiResponse.ok(geoLocationService.listProvinces(country));
    }

    @GetMapping("/cities")
    public ApiResponse<List<GeoLocationDTO>> cities(
        @RequestParam String country,
        @RequestParam(required = false) String province
    ) {
        return ApiResponse.ok(geoLocationService.listCities(country, province));
    }

    @GetMapping("/search")
    public ApiResponse<List<GeoLocationDTO>> search(
        @RequestParam("q") String q,
        @RequestParam(defaultValue = "20") int limit
    ) {
        return ApiResponse.ok(geoLocationService.search(q, limit));
    }

    @GetMapping("/{id}")
    public ApiResponse<GeoLocationDTO> getById(@PathVariable int id) {
        GeoLocationDTO dto = geoLocationService.getById(id);
        if (dto == null) {
            return ApiResponse.error("地址不存在");
        }
        return ApiResponse.ok(dto);
    }
}
