# Checklist de credenciais e pre-requisitos - n8n Eventos

## 1. Infraestrutura (EasyPanel)
- [ ] Subdominio DNS apontando para o IP do servidor (ex.: `n8n.seudominio.com.br` -> registro A)
- [ ] Gerar 2 senhas fortes: Postgres e admin n8n
- [ ] Gerar chave de criptografia: `openssl rand -hex 32` (32 bytes hex)
- [ ] Substituir os `<ALTERAR_...>` no `docker-compose.yml`
- [ ] Criar Compose no EasyPanel, ativar dominio + HTTPS, fazer deploy

## 2. Trello (API)
- [ ] Key da API: https://trello.com/app-key
- [ ] Token pessoal (gerado a partir da pagina acima, clicar em "Token")
- [ ] IDs dos boards usados (JSONs da pasta)
- [ ] Mapear colunas (listas) -> status do evento
  - Exemplo: "A fazer" | "Em andamento" | "Aguardando aprovacao" | "Concluido"
- [ ] Definir convencao de labels/etiquetas (prioridade, tipo de evento)
- [ ] Definir campos customizados usados (due date, responsavel)

## 3. Email (escolher UMA opcao)

### Opcao A - SMTP corporativo
- [ ] Host SMTP (ex.: smtp.office365.com)
- [ ] Porta (587 STARTTLS ou 465 SSL)
- [ ] Usuario e senha (ou App Password se MFA)
- [ ] Email remetente autorizado

### Opcao B - SendGrid (recomendado para volume)
- [ ] Conta SendGrid
- [ ] API Key com permissao "Mail Send"
- [ ] Dominio verificado (SPF/DKIM)

### Opcao C - Gmail API
- [ ] Projeto no Google Cloud Console
- [ ] OAuth Client ID + Secret
- [ ] Conta de servico ou delegacao domain-wide

## 4. Fonte de dados (planilha xlsm)
- [ ] Decidir onde a planilha vai viver:
  - [ ] Pasta `./files/` do servidor (simples, sincronizada via SFTP/rsync)
  - [ ] SharePoint / OneDrive (n8n le via API Microsoft Graph)
  - [ ] Google Drive (n8n le via Drive API)
- [ ] Mapear colunas da planilha -> campos do sistema:
  - nome do evento
  - data do evento
  - responsavel
  - status
  - data de disparo do email
  - template de email a usar
  - destinatarios

## 5. Templates de email
- [ ] Listar tipos de disparo (ex.: convite, lembrete 7 dias, lembrete 1 dia, pos-evento)
- [ ] Texto de cada template (assunto + corpo em HTML)
- [ ] Variaveis que serao substituidas ({{nome_evento}}, {{data}}, {{local}}, etc.)

## 6. Regras de negocio (entrevistar usuario)
- [ ] Qual coluna do Trello dispara qual email?
- [ ] Quantos dias antes do evento enviar lembrete?
- [ ] Quem recebe copia (CC/BCC)?
- [ ] Comportamento quando card muda de coluna manualmente no Trello
- [ ] Como evitar envios duplicados (marcar card com label "Enviado"?)
- [ ] Logs/auditoria de cada envio (onde guardar?)

## 7. Seguranca e operacao
- [ ] Backup diario do volume `postgres_data` (script + cron no servidor)
- [ ] Backup do volume `n8n_data` (credenciais criptografadas vivem aqui)
- [ ] Guardar `N8N_ENCRYPTION_KEY` em cofre (perde-la = perder credenciais)
- [ ] Monitorar execucoes falhas (n8n tem painel Executions)
- [ ] Limitar acesso ao painel por IP (opcional, via EasyPanel/Traefik)

---

## Ordem sugerida de execucao
1. Subir n8n vazio no EasyPanel (itens 1)
2. Conectar com Trello e listar cards (itens 2)
3. Conectar email e enviar 1 teste (itens 3)
4. Ler planilha e cruzar com Trello (itens 4)
5. Montar os workflows reais com templates (itens 5-6)
6. Ativar backups e monitoramento (item 7)
