import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import shadowIcon from "leaflet/dist/images/marker-shadow.png";
import "./App.css";

const customMarker = L.icon({
    iconUrl: markerIcon,
    shadowUrl: shadowIcon,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const formatarCEP = (cep) => cep.replace(/[^0-9]/g, "").slice(0, 8);

function App() {
    const [cep1, setCep1] = useState("");
    const [cep2, setCep2] = useState("");
    const [coordenadas, setCoordenadas] = useState([]);
    const [distancia, setDistancia] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function buscarCoordenadas(cep) {
        try {
            const cepFormatado = formatarCEP(cep);
            const enderecoResponse = await fetch(`http://localhost:3001/cep/${cepFormatado}`);
            const enderecoData = await enderecoResponse.json();

            if (!enderecoData.address) {
                setError("Endereço não encontrado para este CEP.");
                return null;
            }

            const geoResponse = await fetch(`http://localhost:3001/geocode?endereco=${enderecoData.address}`);
            const geoData = await geoResponse.json();

            return geoData.lat && geoData.lon ? { lat: parseFloat(geoData.lat), lon: parseFloat(geoData.lon) } : null;
        } catch (err) {
            setError("Erro ao buscar informações.");
            return null;
        }
    }

    function calcularDistanciaEntreCoordenadas(coord1, coord2) {
        const R = 6371;
        const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
        const dLon = (coord2.lon - coord1.lon) * Math.PI / 180;

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    async function calcularDistancia() {
        setLoading(true);
        setError("");
        setDistancia(null);
        setCoordenadas([]);

        const coord1 = await buscarCoordenadas(cep1);
        const coord2 = await buscarCoordenadas(cep2);

        if (coord1 && coord2) {
            const distanciaCalculada = calcularDistanciaEntreCoordenadas(coord1, coord2);
            setDistancia(distanciaCalculada.toFixed(2));
            setCoordenadas([coord1, coord2]);
        } else {
            setError("Não foi possível calcular a distância.");
        }

        setLoading(false);
    }

    return (
        <div className="container">
            <h1>Calculadora de Distância entre CEPs</h1>
            
            <label>CEP 1:</label>
            <input 
                type="text" 
                placeholder="Digite o primeiro CEP" 
                value={cep1} 
                onChange={(e) => setCep1(formatarCEP(e.target.value))} 
            />

            <label>CEP 2:</label>
            <input 
                type="text" 
                placeholder="Digite o segundo CEP" 
                value={cep2} 
                onChange={(e) => setCep2(formatarCEP(e.target.value))} 
            />

            <button onClick={calcularDistancia} disabled={loading}>
                {loading ? "Buscando..." : "Buscar Distância"}
            </button>

            <div className="result">
                {error && <p className="error">{error}</p>}
                {loading && <p className="loading">🔄 Carregando dados...</p>}
                {distancia && <p>Distância: {distancia} km</p>}
            </div>

            {coordenadas.length === 2 && (
                <MapContainer center={coordenadas[0]} zoom={6} style={{ height: "400px", width: "100%", marginTop: "20px", borderRadius: "10px" }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={coordenadas[0]} icon={customMarker} />
                    <Marker position={coordenadas[1]} icon={customMarker} />
                    <Polyline positions={coordenadas} color="blue" />
                </MapContainer>
            )}
        </div>
    );
}

export default App;