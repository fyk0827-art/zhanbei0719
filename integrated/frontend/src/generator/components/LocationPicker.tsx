import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ListTree, MapPin, Search, X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  fetchCities,
  fetchCountries,
  fetchProvinces,
  searchLocations,
  type GeoLocation,
} from "../services/locationApi";

interface Props {
  value: GeoLocation | null;
  onChange: (loc: GeoLocation | null) => void;
  error?: boolean;
  placeholder?: string;
  className?: string;
}

function formatLocationLabel(loc: GeoLocation): string {
  if (loc.label) return loc.label;
  if (loc.country === "中国") {
    return [loc.province, loc.city].filter(Boolean).join(" · ");
  }
  return [loc.country, loc.province, loc.city].filter(Boolean).join(" · ");
}

export default function LocationPicker({
  value,
  onChange,
  error = false,
  placeholder = "Search city, state, or country",
  className = "prism-input",
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<GeoLocation[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [browseStep, setBrowseStep] = useState<"country" | "province" | "city">("country");
  const [browseFilter, setBrowseFilter] = useState("");
  const [browseLoading, setBrowseLoading] = useState(false);
  const [countries, setCountries] = useState<string[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<GeoLocation[]>([]);
  const [browseCountry, setBrowseCountry] = useState("United States");
  const [browseProvince, setBrowseProvince] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayValue = value ? formatLocationLabel(value) : "";
  const isSearching = search.trim().length >= 2;
  const browseItems = browseStep === "country"
    ? countries
    : browseStep === "province"
      ? provinces
      : cities.map((city) => city.city);
  const filteredBrowseItems = browseItems.filter((item) =>
    item.toLocaleLowerCase().includes(browseFilter.trim().toLocaleLowerCase()),
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!isSearching) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    searchTimerRef.current = setTimeout(() => {
      searchLocations(search.trim(), 16)
        .then((items) => setSearchResults([...items].sort((a, b) => {
          const aIsUs = a.country.startsWith("United States");
          const bIsUs = b.country.startsWith("United States");
          if (aIsUs && !bIsUs) return -1;
          if (bIsUs && !aIsUs) return 1;
          return 0;
        }).slice(0, 10)))
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 280);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [search, isSearching]);

  const handleSelect = useCallback((loc: GeoLocation) => {
    onChange(loc);
    setOpen(false);
    setBrowseOpen(false);
    setSearch("");
  }, [onChange]);

  const openBrowser = () => {
    setOpen(false);
    setBrowseOpen(true);
    setBrowseStep("country");
    setBrowseFilter("");
    if (countries.length > 0) return;
    setBrowseLoading(true);
    fetchCountries()
      .then((list) => setCountries([...list].sort((a, b) => {
        if (a === "United States") return -1;
        if (b === "United States") return 1;
        return a.localeCompare(b, "en");
      })))
      .catch(() => setCountries([]))
      .finally(() => setBrowseLoading(false));
  };

  const selectCountry = (country: string) => {
    setBrowseCountry(country);
    setBrowseProvince("");
    setProvinces([]);
    setCities([]);
    setBrowseFilter("");
    setBrowseLoading(true);
    fetchProvinces(country)
      .then(async (list) => {
        const sorted = [...list].sort((a, b) => a.localeCompare(b, "en"));
        setProvinces(sorted);
        if (sorted.length > 0) {
          setCities([]);
          setBrowseStep("province");
          return;
        }
        const locations = await fetchCities(country);
        setCities(locations);
        setBrowseStep("city");
      })
      .catch(() => setProvinces([]))
      .finally(() => setBrowseLoading(false));
  };

  const selectProvince = (province: string) => {
    setBrowseProvince(province);
    setBrowseFilter("");
    setBrowseLoading(true);
    fetchCities(browseCountry, province)
      .then((list) => {
        setCities(list);
        setBrowseStep("city");
      })
      .catch(() => setCities([]))
      .finally(() => setBrowseLoading(false));
  };

  const browseBack = () => {
    setBrowseFilter("");
    if (browseStep === "city" && provinces.length > 0) setBrowseStep("province");
    else setBrowseStep("country");
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          value={open ? search : displayValue}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
            if (value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={`${className}${error ? " error" : ""}`}
          style={{ paddingLeft: 40, paddingRight: 48 }}
        />
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: "rgba(232,185,81,0.25)" }}
        />
        <button
          type="button"
          className="loc-browse-trigger"
          onClick={openBrowser}
          aria-label="Browse locations"
          title="Browse locations"
        >
          <ListTree aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="loc-cascader-dropdown loc-search-dropdown mt-1">
          {!isSearching ? (
            <div className="loc-search-prompt">
              <MapPin aria-hidden="true" />
              <div>
                <strong>Search your birth city</strong>
                <span>Type at least 2 letters, for example “New York” or “London”.</span>
              </div>
            </div>
          ) : searchLoading ? (
            <div className="loc-cascader-empty">Searching…</div>
          ) : searchResults.length > 0 ? (
            searchResults.map((loc) => (
              <button
                key={loc.id}
                type="button"
                className="prism-city-opt loc-search-result w-full text-left"
                onClick={() => handleSelect(loc)}
              >
                <MapPin aria-hidden="true" />
                <span className="loc-search-result-copy">
                  <strong>{loc.city}</strong>
                  <small>{[loc.province, loc.country].filter(Boolean).join(", ")}</small>
                </span>
              </button>
            ))
          ) : (
            <div className="loc-cascader-empty">No matching cities. Try a nearby city or a different spelling.</div>
          )}
        </div>
      )}

      <Drawer open={browseOpen} onOpenChange={setBrowseOpen}>
        <DrawerContent className="loc-mobile-drawer">
          <DrawerHeader className="loc-drawer-header">
            <div className="loc-drawer-title-row">
              {browseStep !== "country" ? (
                <button type="button" onClick={browseBack} aria-label="Go back" title="Go back" className="loc-drawer-icon-btn">
                  <ChevronLeft aria-hidden="true" />
                </button>
              ) : <span className="loc-drawer-icon-spacer" />}
              <div>
                <DrawerTitle>
                  {browseStep === "country" ? "Choose a country" : browseStep === "province" ? "Choose a state or province" : "Choose a city"}
                </DrawerTitle>
                <DrawerDescription>
                  {browseStep === "country" ? "United States is shown first" : browseStep === "province" ? browseCountry : [browseProvince, browseCountry].filter(Boolean).join(", ")}
                </DrawerDescription>
              </div>
              <button type="button" onClick={() => setBrowseOpen(false)} aria-label="Close" title="Close" className="loc-drawer-icon-btn">
                <X aria-hidden="true" />
              </button>
            </div>
            <div className="loc-drawer-search">
              <Search aria-hidden="true" />
              <input
                type="search"
                value={browseFilter}
                onChange={(event) => setBrowseFilter(event.target.value)}
                placeholder={browseStep === "country" ? "Search countries" : browseStep === "province" ? "Search states or provinces" : "Search cities"}
                autoComplete="off"
              />
            </div>
          </DrawerHeader>

          <div className="loc-drawer-list">
            {browseLoading ? (
              <div className="loc-cascader-empty">Loading locations…</div>
            ) : filteredBrowseItems.length === 0 ? (
              <div className="loc-cascader-empty">No matching locations</div>
            ) : browseStep === "city" ? (
              cities
                .filter((city) => city.city.toLocaleLowerCase().includes(browseFilter.trim().toLocaleLowerCase()))
                .map((city) => (
                  <button key={city.id} type="button" className="loc-drawer-option" onClick={() => handleSelect(city)}>
                    <span>{city.city}</span>
                    <small>{[city.province, city.country].filter(Boolean).join(", ")}</small>
                  </button>
                ))
            ) : (
              filteredBrowseItems.map((item) => (
                <button key={item} type="button" className="loc-drawer-option loc-drawer-option-next" onClick={() => browseStep === "country" ? selectCountry(item) : selectProvince(item)}>
                  <span>{item}</span>
                  <ChevronRight aria-hidden="true" />
                </button>
              ))
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
