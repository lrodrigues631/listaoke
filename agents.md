# Listaokê - Instruções para o Codex

## Objetivo do projeto

Listaokê é um app para criar salas de karaokê compartilhadas em tempo real.

O dono cria uma sala, compartilha um link/código com os amigos e controla a fila. Os convidados conseguem entrar na fila, ver a ordem em tempo real, passar a própria vez ou sair da fila.

## Stack atual

- React
- Vite
- Tailwind CSS
- Supabase
- JavaScript
- Futuro PWA
- Futuro APK Android via Capacitor

## Regras importantes

1. Não transformar o projeto em Next.js.
2. Não adicionar Stripe, Prisma, Resend, Auth.js ou SaaS completo agora.
3. Fazer alterações pequenas e testáveis.
4. Preservar a lógica principal do app atual.
5. Remover o cronômetro do app, pois a duração das músicas varia.
6. Priorizar uso com amigos, por link/PWA.
7. O app deve funcionar bem em celular.
8. Não fazer git push sem autorização.
9. Sempre validar com `npm run build` depois de alterações relevantes.

## Modelo do produto

### Dono da sala

Pode:
- criar sala;
- compartilhar link/código;
- adicionar participantes;
- remover participantes;
- mover pessoas na fila;
- concluir apresentação;
- passar vez de qualquer pessoa;
- fechar sessão.

### Convidado

Pode:
- entrar na sala;
- escolher nome;
- entrar na fila;
- ver fila em tempo real;
- passar a própria vez;
- sair da fila.

Não pode:
- mover outras pessoas;
- remover outras pessoas;
- fechar a sessão;
- alterar o cantor atual.

## Fases do projeto

### Fase 1
- Conectar Supabase.
- Criar estrutura de sala.
- Criar fluxo de entrar/criar sala.
- Sincronizar fila em tempo real.

### Fase 2
- Melhorar responsividade mobile.
- Transformar em PWA.
- Adicionar aviso de próximo da fila.

### Fase 3
- Gerar APK Android com Capacitor.