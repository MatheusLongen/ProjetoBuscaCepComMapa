const express = require("express");
const cors = require("cors");
global.fetch = fetch;

const app = express();
app.use(cors());

app.get("/cep/:cep", async (req, res) => {
    try {
        const cep = req.params.cep;

        const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`);
        const data = await response.json();

        if (data.street && data.city && data.state) {
            res.json({ address: `${data.street}, ${data.city}, ${data.state}` });
        } else {
            res.status(404).json({ error: "Endereço não encontrado" });
        }
    } catch (error) {
        res.status(500).json({ error: "Erro interno no servidor" });
    }
});

app.get("/geocode", async (req, res) => {
    try {
        const { endereco } = req.query;
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.length > 0) {
            res.json({ lat: data[0].lat, lon: data[0].lon });
        } else {
            res.status(404).json({ error: "Localização não encontrada para este endereço" });
        }
    } catch (error) {
        res.status(500).json({ error: "Erro interno ao buscar coordenadas" });
    }
});

app.listen(3001, () => {
    console.log("Backend rodando na porta 3001");
});