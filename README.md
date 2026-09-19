# Sistema de Orçamento de Engenharia - DIPRED/DMAN - TJRS

## Visão geral

Sistema web desenvolvido para automatizar o cálculo de orçamentos de serviços de engenharia (materiais com instalação, diagnósticos e manutenção, locação de equipamentos) do DIPRED/DMAN (Tribunal de Justiça do Rio Grande do Sul - TJRS). O sistema calcula valores por item de acordo com a comarca e o lote/empresa contratada, permite gerar um relatório em PDF do orçamento montado e disponibiliza uma área administrativa para atualização dos preços vigentes.

O sistema proporciona:

- Cálculo automático de orçamentos de engenharia por comarca, lote e item
- Geração de relatório de medição e orçamento em PDF
- Padronização dos preços praticados por empresa/lote contratado
- Área administrativa protegida para atualização de valores

O sistema permanece aplicável independentemente da empresa contratada via licitação em cada lote.

---

## Autoria

Desenvolvido por Marcelo Diehl, para uso do DIPRED/DMAN - Tribunal de Justiça do Rio Grande do Sul (TJRS).

A propriedade intelectual do código-fonte pertence ao autor, com cessão integral de uso ao Tribunal de Justiça do RS para fins institucionais.

---

## Tecnologias Utilizadas

- Backend: Java 17 com Spring Boot 4.1.1 (Spring Web MVC, Spring Data JPA, Spring Security, Bean Validation)
- Frontend: HTML5, CSS3 (Bootstrap 5.3), JavaScript
- Alertas e confirmações: SweetAlert2
- Geração de PDF: jsPDF + jsPDF-AutoTable
- Banco de Dados: MySQL - SQL Relacional
- Gerenciador de Dependências: Maven
- Segurança: Spring Security (BCrypt + HTTP Basic Auth para rotas administrativas)

---

## Arquitetura do Sistema

O sistema opera de forma desacoplada, seguindo o mesmo padrão do projeto de referência (DSUP):

- Aplicação (.jar): lógica de negócio, API REST e interface web servidos por um único processo (Spring Boot com Tomcat embutido)
- Banco de Dados: armazena comarcas, lotes, grupos/subgrupos/itens de orçamento, preços e usuários administrativos
- Front-end estático: servido pela própria aplicação Spring Boot (`src/main/resources/static`), consumindo a API REST via `fetch`

---

## Estrutura do Projeto

```
dipred_dman/
├── db/
│   └── dipred_orcamento_db.sql      # Script de criação e carga do banco
├── front-end/                       # Fonte de design original (protótipo/referência visual)
├── src/main/java/tjrs/dipred/orcamento/
│   ├── config/                      # SecurityConfig (BCrypt + HTTP Basic)
│   ├── controller/                  # Endpoints REST (orçamento, auth, admin)
│   ├── dto/                         # Objetos de transporte da API
│   ├── model/                       # Entidades JPA
│   ├── repository/                  # Repositórios Spring Data JPA
│   ├── security/                    # UserDetailsService
│   └── service/                     # Regras de negócio e setup inicial
└── src/main/resources/
    ├── application.properties
    └── static/                      # Front-end em produção (index.html, orcamento.js, orcamento.css, style.css)
```

---

## Banco de Dados

Script: `db/dipred_orcamento_db.sql`

### Responsável por:

- Criação do banco de dados e das tabelas
- Inserção dos dados iniciais (comarcas, lotes/empresas contratadas, grupos/subgrupos/itens de orçamento e seus preços por lote)
- Criação do usuário de acesso da aplicação

### Modelo de dados:

- **Lote**: empresa contratada, número do contrato e regiões que atende
- **Comarca**: vinculada a um lote, com sua região informativa
- **Grupo → Subgrupo → Item**: hierarquia dos itens de orçamento (ex.: "Materiais com Instalação" → "Telecomunicações" → "Fornecimento e instalação de ponto lógico...")
- **PrecoItem**: preço de cada item por lote (pode ser indisponível/"N.A" para um lote específico)
- **Usuario**: credenciais da área administrativa (senha com hash BCrypt)

### Configurações:

- Database: `dipred_orcamento_db`
- Usuário: `dipred_user`
- Porta padrão: 3306

### Senha do usuário do banco

A senha **não** fica no código-fonte. Antes de rodar o script:

1. Edite `db/dipred_orcamento_db.sql` e troque `ALTERE_ESTA_SENHA` pela senha real que deseja usar.
2. Configure a variável de ambiente `DB_PASSWORD` da aplicação com essa mesma senha (a aplicação lê `spring.datasource.password=${DB_PASSWORD}` em `application.properties`).

Exemplo (PowerShell):

```powershell
$env:DB_PASSWORD = "sua-senha-aqui"
```

Exemplo (bash):

```bash
export DB_PASSWORD="sua-senha-aqui"
```

Na IDE (IntelliJ), adicione `DB_PASSWORD=sua-senha-aqui` em Run/Debug Configurations → Environment variables.

---

## Regras de Negócio

### Seleção de Preço

O valor unitário de cada item é obtido pelo preço cadastrado para o lote correspondente à comarca selecionada. Itens sem preço definido para um lote ficam indisponíveis (desabilitados) no cálculo.

### Totalização

Soma-se `quantidade × valor unitário` de cada item preenchido, com subtotal por grupo e valor total geral do orçamento.

### Relatório

O relatório de medição e orçamento é gerado em PDF no próprio navegador (sem passar pelo servidor), incluindo apenas os itens com quantidade preenchida.

---

## Segurança e Autenticação

### Autenticação

- Leitura pública: comarcas, lotes e itens de orçamento (`/api/comarcas`, `/api/lotes`, `/api/itens-orcamento`) são acessíveis sem autenticação, pois alimentam a calculadora pública.
- Escrita administrativa: `/api/admin/**` (atualização de preços e troca de senha) exige HTTP Basic Auth, validado contra a tabela `usuarios` com senha em hash BCrypt.
- As credenciais nunca são persistidas no navegador (nem `localStorage` nem `sessionStorage`) — ficam apenas em memória durante a sessão da página.

### Senha provisória

No primeiro boot, a aplicação cria automaticamente o usuário administrativo padrão com senha provisória. No primeiro login, o sistema solicita a troca da senha antes de liberar o uso normal da área administrativa.

### Usuário padrão

```
admin
```

Senha inicial:

```
@Dipred26
```

A troca é solicitada automaticamente no primeiro login administrativo.

---

## Execução do Sistema

### Banco de Dados

- Editar `db/dipred_orcamento_db.sql` trocando `ALTERE_ESTA_SENHA` pela senha desejada
- Executar o script (cria o banco, as tabelas, a carga inicial de dados e o usuário `dipred_user`)

### Aplicação

Definir a variável de ambiente `DB_PASSWORD` com a mesma senha usada no script (ver seção [Banco de Dados](#banco-de-dados)), depois:

```bash
./mvnw clean package
java -jar target/orcamento-0.0.1-SNAPSHOT.jar
```

Ou em modo de desenvolvimento:

```bash
./mvnw spring-boot:run
```

### Acesso

```
http://localhost:8082
```

---

## Manutenção

### Compilação

```bash
./mvnw clean package
```

### Execução

```bash
java -jar target/orcamento-0.0.1-SNAPSHOT.jar
```

---

## Observações

- Sistema projetado para uso em rede local do TJRS
- Credenciais administrativas trafegam em HTTP Basic (base64); recomenda-se HTTPS caso o sistema seja exposto além da rede interna confiável
- Estrutura simples e de fácil manutenção, seguindo o mesmo padrão do projeto de referência (DSUP)

---

## Licença

Uso institucional – Tribunal de Justiça do Rio Grande do Sul (TJRS)
