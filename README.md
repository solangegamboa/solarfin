# SolarFin - Seu Gerenciador Financeiro Pessoal

SolarFin é uma aplicação web moderna e completa para gerenciamento financeiro pessoal, construída com tecnologias de ponta para oferecer uma experiência de usuário fluida, inteligente e segura.

## Funcionalidades

A aplicação conta com um conjunto robusto de funcionalidades para ajudar você a ter total controle sobre suas finanças:

*   **Autenticação de Usuários:** Sistema seguro de cadastro e login utilizando Firebase Authentication.
*   **Dashboard Interativo:** Um painel de controle central que exibe um resumo financeiro do mês atual, incluindo:
    *   Balanço (Receitas - Despesas).
    *   Total de receitas e gastos.
    *   Uma previsão detalhada dos gastos do mês, somando faturas de cartão, parcelas de empréstimos e despesas recorrentes.
    *   Gráfico de distribuição de gastos por categoria.
    *   Lista das transações mais recentes.
*   **Gerenciamento de Transações:**
    *   Adicione, liste e exclua transações de entrada e saída.
    *   **Cadastro Inteligente com IA:** Envie uma foto de um cupom fiscal e a IA do Gemini extrairá automaticamente o valor total da despesa.
*   **Gerenciamento de Cartões de Crédito:**
    *   Cadastre múltiplos cartões de crédito.
    *   Defina um cartão como padrão para agilizar o lançamento de despesas.
    *   Informe o dia de fechamento e vencimento para um cálculo preciso da fatura.
    *   Lance compras parceladas.
*   **Gerenciamento de Empréstimos:**
    *   Cadastre empréstimos, informando instituição, valor da parcela, total de parcelas e data de contratação.
    *   Acompanhe o progresso de pagamento de cada empréstimo.
*   **Despesas Recorrentes:**
    *   Salve despesas fixas (como aluguel, assinaturas) para automatizar o controle e melhorar a previsibilidade.
*   **Tema Claro e Escuro:** Alterne entre os temas para maior conforto visual.
*   **Sugestões com IA:** Uma página dedicada a receber sugestões personalizadas de economia com base na sua atividade financeira.

## Tecnologias Utilizadas

Este projeto foi desenvolvido utilizando um stack moderno e escalável:

*   **Framework Frontend:** [Next.js](https://nextjs.org/) (com App Router)
*   **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
*   **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
*   **Componentes de UI:** [ShadCN UI](https://ui.shadcn.com/)
*   **Banco de Dados:** [Firebase Firestore](https://firebase.google.com/docs/firestore)
*   **Autenticação:** [Firebase Authentication](https://firebase.google.com/docs/auth)
*   **Inteligência Artificial (GenAI):** [Genkit](https://firebase.google.com/docs/genkit) com os modelos [Gemini do Google](https://deepmind.google/technologies/gemini/) para a leitura de cupons fiscais.
*   **Gerenciamento de Formulários:** [React Hook Form](https://react-hook-form.com/)
*   **Validação de Esquemas:** [Zod](https://zod.dev/)
*   **Gráficos:** [Recharts](https://recharts.org/)
*   **Gerenciamento de Estado:** [React Context API](https://react.dev/learn/passing-data-deeply-with-context)
