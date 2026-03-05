# Provador Virtual

MVP de provador virtual com IA — envie sua foto e uma peca de roupa para ver como o look ficaria em voce.

## Como rodar

```bash
# Instalar dependencias
npm install

# Rodar em desenvolvimento
npm run dev

# Build de producao
npm run build
npm run start
```

Acesse `http://localhost:3000`.

## Estrutura

```
app/
  page.tsx              # Landing page
  try/page.tsx          # Interface principal do provador
  result/[id]/page.tsx  # Pagina de resultado (stub)
  api/generate/route.ts # Endpoint de geracao (stub)
components/
  TryOnInterface.tsx    # Componente principal com toda a logica de upload e estados
```

## Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **lucide-react** para icones

## Proximos passos (integracao de IA)

1. **Replicate IDM-VTON** — modelo open source de virtual try-on
   - Endpoint: `app/api/generate/route.ts` (ja preparado)
   - Instalar: `npm install replicate`

2. **Armazenamento de imagens** — Cloudflare R2 ou Vercel Blob
   - Guardar imagem do usuario, roupa e resultado por `job_id`

3. **Pagina de resultado** — `app/result/[id]/page.tsx` (ja criada)
   - Exibir imagem gerada, botoes de salvar e compartilhar

4. **Polling de status** — verificar progresso da geracao em tempo real

### Exemplo de integracao com Replicate

```ts
// app/api/generate/route.ts
import Replicate from "replicate";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

const prediction = await replicate.predictions.create({
  model: "cuuupid/idm-vton",
  input: {
    human_img: userImageUrl,
    garm_img: clothesImageUrl,
    garment_des: "roupa",
  },
});
```

## Variaveis de ambiente

Crie um `.env.local`:

```env
REPLICATE_API_TOKEN=r8_...
BLOB_READ_WRITE_TOKEN=...   # Vercel Blob (opcional)
```
