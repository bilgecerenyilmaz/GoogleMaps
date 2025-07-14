import React, { useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  DirectionsRenderer,
} from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";
import "@reach/combobox/styles.css";

const libraries = ["places"];
const mapContainerStyle = { width: "100vw", height: "100vh" };
const defaultCenter = { lat: 43.6532, lng: -79.3832 };

const Panel = styled.div`
  position: absolute;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  z-index: 10;
`;

const TopLeftPanel = styled(Panel)`
  top: 10px;
  left: 10px;
  max-width: 720px;
  width: calc(100vw - 40px);
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const TopRightPanel = styled(Panel)`
  top: 10px;
  right: 10px;
  width: 300px;
`;

const BottomRightPanel = styled(Panel)`
  bottom: 10px;
  right: 10px;
  max-width: 300px;
`;

const FlexRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const FieldWrapper = styled.div`
  flex: 1 1 300px;
  min-width: 280px;
`;

const Label = styled.label`
  font-weight: bold;
  display: block;
  margin-bottom: 5px;
`;

const Button = styled.button`
  padding: 0 10px;
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid #1976d2;
  background-color: #1976d2;
  color: white;
`;

const DeleteButton = styled.button`
  margin-left: 8px;
  background: red;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 2px 6px;
  cursor: pointer;
`;

export default function App() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_API_KEY,
    libraries,
  });

  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [directions, setDirections] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [waypointInput, setWaypointInput] = useState("");

  useEffect(() => {
    if (!origin && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setOrigin({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: "",
          }),
        () => setOrigin({ ...defaultCenter, address: "" })
      );
    }
  }, [origin]);

  useEffect(() => {
    if (!origin || !destination) {
      setDirections(null);
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
        waypoints: waypoints.map((loc) => ({
          location: { lat: loc.lat, lng: loc.lng },
          stopover: true,
        })),
        optimizeWaypoints: true,
      },
      (result, status) => {
        if (status === "OK" && result) {
          setDirections(result);
        } else {
          setDirections(null);
        }
      }
    );
  }, [origin, destination, waypoints]);

  const useCurrentLocation = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setOrigin({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          address: "",
        }),
      () => {}
    );
  }, []);

  const removeWaypoint = useCallback((indexToRemove) => {
    setWaypoints((prev) => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  const handleWaypointSelect = useCallback((address, latLng) => {
    setWaypoints((prev) => [...prev, { ...latLng, address }]);
    setWaypointInput("");
  }, []);

  if (loadError) return <div>Harita yuklenemedi.</div>;
  if (!isLoaded) return <div>Harita yukleniyor...</div>;
  if (!origin) return <div>Kullanici konumu aliniyor...</div>;

  return (
    <>
      <TopRightPanel>
        <h4>Durak Ekle</h4>
        <PlacesAutocomplete
          id="waypoint-autocomplete"
          onSelect={handleWaypointSelect}
          placeholder="Durak adresi girin"
          value={waypointInput}
          setValue={setWaypointInput}
        />
      </TopRightPanel>

      <TopLeftPanel>
        <FlexRow>
          <FieldWrapper>
            <Label htmlFor="origin-autocomplete">Başlangıç Adresi</Label>
            <FlexRow>
              <PlacesAutocomplete
                id="origin-autocomplete"
                onSelect={(address, latLng) => setOrigin({ ...latLng, address })}
                placeholder="Başlangıç adresi"
                value={origin?.address || ""}
                setValue={(val) => setOrigin((prev) => ({ ...prev, address: val }))}
              />
              <Button onClick={useCurrentLocation}>Şu Anki Konumum</Button>
            </FlexRow>
          </FieldWrapper>

          <FieldWrapper>
            <Label htmlFor="destination-autocomplete">Varış Adresi</Label>
            <PlacesAutocomplete
              id="destination-autocomplete"
              onSelect={(address, latLng) => setDestination({ ...latLng, address })}
              placeholder="Varış adresi"
              value={destination?.address || ""}
              setValue={(val) => setDestination((prev) => ({ ...prev, address: val }))}
            />
          </FieldWrapper>
        </FlexRow>
      </TopLeftPanel>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={13}
        center={origin}
        options={{ zoomControl: true, gestureHandling: "auto" }}
      >
        {origin && <Marker position={origin} label="Başlangıç" />}
        {destination && <Marker position={destination} label="Varış" />}
        {directions && <DirectionsRenderer directions={directions} />}
      </GoogleMap>

      <BottomRightPanel>
        <h4>Eklenen Duraklar</h4>
        {waypoints.length === 0 && <p>Henüz durak eklenmedi.</p>}
        <ul style={{ padding: 0, listStyle: "none" }}>
          {waypoints.map((wp, index) => (
            <li
              key={index}
              style={{
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>{wp.address || `Durak ${index + 1}`}</span>
              <DeleteButton onClick={() => removeWaypoint(index)}>
                Sil
              </DeleteButton>
            </li>
          ))}
        </ul>
      </BottomRightPanel>
    </>
  );
}

function PlacesAutocomplete({ id, onSelect, placeholder, value, setValue }) {
  const {
    ready,
    setValue: setInternalValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({ debounce: 300 });

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value, false);
    }
  }, [value, setInternalValue]);

  const handleSelect = useCallback(
    async (address) => {
      setInternalValue(address, false);
      clearSuggestions();

      try {
        const results = await getGeocode({ address });
        const latLng = await getLatLng(results[0]);
        onSelect(address, latLng);
      } catch {}
    },
    [onSelect, clearSuggestions, setInternalValue]
  );

  return (
    <Combobox onSelect={handleSelect} aria-label={placeholder} id={id}>
      <ComboboxInput
        style={{ width: "100%", padding: "8px", fontSize: "16px" }}
        placeholder={placeholder}
        disabled={!ready}
        value={value}
        onChange={(e) => {
          setInternalValue(e.target.value);
          setValue(e.target.value);
        }}
      />
      <ComboboxPopover>
        <ComboboxList>
          {status === "OK" &&
            data.map(({ place_id, description }) => (
              <ComboboxOption key={place_id} value={description} />
            ))}
        </ComboboxList>
      </ComboboxPopover>
    </Combobox>
  );
}

