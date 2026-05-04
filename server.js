require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { Resend } = require('resend');

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);


const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 },
});

const fileFields = [
    { name: 'fotoVeiculo', maxCount: 10 },
    { name: 'videoVeiculo', maxCount: 1 },
    { name: 'docVeiculo', maxCount: 5 },
    { name: 'docAssociado', maxCount: 5 },
    { name: 'docCondutor', maxCount: 5 },
    { name: 'comprovanteResidencia', maxCount: 5 },
    { name: 'boletimOcorrencia', maxCount: 5 },
];

app.use(express.static(__dirname));

app.post('/submit', upload.fields(fileFields), async (req, res) => {
    try {
        const d = req.body;
        const files = req.files || {};

        const attachments = [];

        const fileLabels = {
            fotoVeiculo: 'Foto do veículo',
            videoVeiculo: 'Vídeo do veículo',
            docVeiculo: 'Documento do veículo',
            docAssociado: 'Doc. do associado',
            docCondutor: 'Doc. do condutor',
            comprovanteResidencia: 'Comprovante de residência',
            boletimOcorrencia: 'Boletim de ocorrência',
        };

        const MAX_FILE_MB = 8;
        const MAX_TOTAL_MB = 28;
        const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
        const MAX_TOTAL_BYTES = MAX_TOTAL_MB * 1024 * 1024;

        let totalBytes = 0;
        const attachedFileNames = {};

        for (const [field, fieldFiles] of Object.entries(files)) {
            attachedFileNames[field] = [];
            for (const file of fieldFiles) {
                if (file.size > MAX_FILE_BYTES) {
                    attachedFileNames[field].push(`${file.originalname} (ignorado — acima de ${MAX_FILE_MB}MB)`);
                    continue;
                }
                if (totalBytes + file.size > MAX_TOTAL_BYTES) {
                    attachedFileNames[field].push(`${file.originalname} (ignorado — limite total de ${MAX_TOTAL_MB}MB atingido)`);
                    continue;
                }
                totalBytes += file.size;
                attachments.push({
                    filename: file.originalname,
                    content: file.buffer,
                    contentType: file.mimetype,
                });
                attachedFileNames[field].push(file.originalname);
            }
        }

        const html = buildEmailHtml(d, attachedFileNames, fileLabels);

        const eventTypeLabel = {
            colisao: 'Colisão',
            'roubo-furto': 'Roubo/Furto',
            fenomenos: 'Fenômenos da natureza',
            vidros: 'Vidros',
            'carro-reserva': 'Carro Reserva',
        }[d.eventType] || d.eventType;

        await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL,
            to: process.env.RESEND_TO_EMAIL,
            replyTo: d.email,
            subject: `Comunicado: ${eventTypeLabel} — ${d.nomeAssociado} (${d.placa})`,
            html,
            attachments,
        });

        res.json({ ok: true });
    } catch (err) {
        console.error('Erro ao enviar email:', err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

function row(label, value) {
    if (!value) return '';
    return `
        <tr>
            <td style="padding:8px 0;font-size:13px;color:#6b7280;white-space:nowrap;vertical-align:top;width:40%;">${label}</td>
            <td style="padding:8px 0 8px 16px;font-size:13px;color:#111827;vertical-align:top;">${value}</td>
        </tr>`;
}

function section(title, rows) {
    return `
        <tr><td style="padding:24px 40px 0;">
            <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">${title}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f3f4f6;">
                ${rows}
            </table>
        </td></tr>`;
}

function buildEmailHtml(d, attachedFileNames, fileLabels) {
    const eventTypeMap = {
        colisao: 'Colisão', 'roubo-furto': 'Roubo/Furto',
        fenomenos: 'Fenômenos da natureza', vidros: 'Vidros', 'carro-reserva': 'Carro Reserva',
    };
    const reparoParaMap = {
        associado: 'Associado', 'associado-terceiro': 'Associado/Terceiro', 'somente-terceiro': 'Somente Terceiro',
    };
    const condutorMap = { 'proprio-associado': 'Próprio associado', 'outro-condutor': 'Outro condutor' };
    const tipoDocMap = { cpf: 'CPF', cnpj: 'CNPJ', rg: 'RG', cnh: 'CNH' };

    const docValue = d.cpf || d.cnpj || d.rg || d.cnh || '';
    const tipoDoc = tipoDocMap[d.tipoDocumento] || d.tipoDocumento;

    const dataEvento = d.dataEvento
        ? new Date(d.dataEvento).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
        : '';

    const dataNasc = d.dataNascimento
        ? new Date(d.dataNascimento + 'T12:00:00').toLocaleDateString('pt-BR')
        : '';

    const filesRows = Object.entries(fileLabels)
        .map(([field, label]) => {
            const names = attachedFileNames[field];
            if (!names || names.length === 0) return '';
            return row(label, names.join('<br>'));
        })
        .join('');

    return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

        <tr><td style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:28px 40px;text-align:center;">
          <p style="color:#ffffff;margin:0 0 16px;font-size:24px;font-weight:700;letter-spacing:0.12em;">SMART BRASIL</p>
          <p style="color:#94a3b8;margin:0;font-size:13px;text-transform:uppercase;letter-spacing:0.1em;">Novo Comunicado de Evento</p>
          <h1 style="color:#ffffff;margin:8px 0 4px;font-size:22px;">${eventTypeMap[d.eventType] || d.eventType}</h1>
          <p style="color:#cbd5e1;margin:0;font-size:14px;">${d.nomeAssociado} &mdash; Placa ${d.placa || '—'}</p>
        </td></tr>

        ${section('Dados Pessoais', [
            row('Tipo de evento', eventTypeMap[d.eventType]),
            row('Reparo para', reparoParaMap[d.reparoPara]),
            row('Nome', d.nomeAssociado),
            row('Data de nascimento', dataNasc),
            row('Condutor', condutorMap[d.condutor]),
            row(tipoDoc, docValue),
            row('Endereço', d.endereco),
            row('Telefone', d.telefone),
            row('Email', d.email),
        ].join(''))}

        ${section('Dados do Veículo', [
            row('Placa', d.placa),
            row('Marca / Modelo', [d.marca, d.modelo].filter(Boolean).join(' / ')),
            row('Ano fab. / mod.', [d.anoFabricacao, d.anoModelo].filter(Boolean).join(' / ')),
            row('Cor', d.cor),
            row('Chassi', d.chassi),
        ].join(''))}

        ${section('Relato dos Fatos', [
            row('Data do evento', dataEvento),
            row('Local', d.localEvento),
            row('Testemunhas', d.testemunhas === 'sim' ? 'Sim' : 'Não'),
            row('Relato', (d.relato || '').replace(/\n/g, '<br>')),
        ].join(''))}

        ${filesRows ? section('Documentos Anexados', filesRows) : ''}

        <tr><td style="padding:24px 40px 32px;border-top:1px solid #f3f4f6;text-align:center;margin-top:24px;">
          <p style="margin:0;font-size:12px;color:#d1d5db;">&copy; ${new Date().getFullYear()} Smart Brasil &mdash; Clube de Benefícios</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
