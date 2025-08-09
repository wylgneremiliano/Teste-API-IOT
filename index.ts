import express from "express";
import crypto from 'crypto';



const app = express();
app.use(express.json());



const ACCESS_ID = "";
const ACCESS_KEY = "";
const BASE_URL = "https://openapi.tuyaus.com";
const DEVICE_ID_LAMPADA = "";
const DEVICE_ID_RELE = "";



const method = 'GET';
const urlPath = '/v1.0/token?grant_type=1';

const t = Date.now().toString();


const contentSha256 = sha256('');
const stringToSign = `${method}\n${contentSha256}\n\n${urlPath}`;
const signStr = `${ACCESS_ID}${t}${stringToSign}`;
const sign = hmacSha256(signStr, ACCESS_KEY);


function sha256(content: string) {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

function hmacSha256(content: string, secret: crypto.BinaryLike | crypto.KeyObject) {
    return crypto.createHmac('sha256', secret).update(content, 'utf8').digest('hex').toUpperCase();
}

async function getTuyaToken() {

    const headers = {
        'client_id': ACCESS_ID,
        'sign': sign,
        't': t,
        'sign_method': 'HMAC-SHA256',
    };

    const res = await fetch(`${BASE_URL}${urlPath}`, { method, headers });
    const data = await res.json();

    return data.result.access_token;
}





function signRequest(method: string, urlPath: string, query = '', body = '', accessToken = '') {
    const t = Date.now().toString();
    const contentSha256 = sha256(body || '');
    const fullPath = query ? `${urlPath}?${query}` : urlPath;

    const stringToSign = `${method}\n${contentSha256}\n\n${fullPath}`;
    const signStr = `${ACCESS_ID}${accessToken}${t}${stringToSign}`;
    const sign = hmacSha256(signStr, ACCESS_KEY);

    return { sign, t };
}

async function sendCommand(deviceId: string, command: string, value: boolean) {
    const token = await getTuyaToken();
    const method = 'POST';
    const urlPath = `/v1.0/devices/${deviceId}/commands`;

    const bodyObj = {
        commands: [
            { code: command, value: value }
        ]
    };
    const bodyStr = JSON.stringify(bodyObj);

    const { sign, t } = signRequest(method, urlPath, '', bodyStr, token);

    const headers = {
        'client_id': ACCESS_ID,
        'access_token': token,
        'sign': sign,
        't': t,
        'sign_method': 'HMAC-SHA256',
        'Content-Type': 'application/json'
    };

    const res = await fetch(`${BASE_URL}${urlPath}`, {
        method,
        headers,
        body: bodyStr
    });

    return await res.json();
}


app.post('/turn-on-switch', async (_, res) => {
    try {
        const data = await sendCommand(DEVICE_ID_RELE, 'switch_1', true);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/turn-off-switch', async (_, res) => {
    try {
        const data = await sendCommand(DEVICE_ID_RELE, 'switch_1', false);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/turn-on-light', async (_, res) => {
    try {
        const data = await sendCommand(DEVICE_ID_LAMPADA, 'switch_led', true);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/turn-off-light', async (_, res) => {
    try {
        const data = await sendCommand(DEVICE_ID_LAMPADA, 'switch_led', false);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});






// Iniciar servidor
app.listen(3000, () => {
    console.log("API rodando em http://localhost:3000");
});

// Fechar conexão ao encerrar o processo
