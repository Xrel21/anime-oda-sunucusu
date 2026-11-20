const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });
const odalar = new Map();

wss.on("connection", (ws) => {
  let mevcutOda = null;

  ws.on("message", (hamVeri) => {
    let veri;
    try {
      veri = JSON.parse(hamVeri.toString());
    } catch {
      return;
    }

    if (veri.tip === "oda_katil" && veri.odaKodu) {
      mevcutOda = veri.odaKodu.trim().toUpperCase();
      if (!odalar.has(mevcutOda)) {
        odalar.set(mevcutOda, new Set());
      }
      odalar.get(mevcutOda).add(ws);
      ws.send(JSON.stringify({ tip: "oda_baglandi", odaKodu: mevcutOda }));
      return;
    }

    if (mevcutOda && odalar.has(mevcutOda)) {
      for (const istemci of odalar.get(mevcutOda)) {
        if (istemci !== ws && istemci.readyState === WebSocket.OPEN) {
          istemci.send(JSON.stringify(veri));
        }
      }
    }
  });

  ws.on("close", () => {
    if (mevcutOda && odalar.has(mevcutOda)) {
      odalar.get(mevcutOda).delete(ws);
      if (odalar.get(mevcutOda).size === 0) {
        odalar.delete(mevcutOda);
      }
    }
  });
});

console.log(`Oda sunucusu ${PORT} portunda çalışıyor...`);