import type { LegalTexts } from ".";

// Versão de referência: as traduções seguem este texto e, em caso de dúvida, vale o português.
const pt: LegalTexts = {
  privacy: {
    title: "Política de Privacidade",
    intro:
      "Esta política explica quais dados pessoais o Orbi coleta, para que usa, com quem compartilha e como você controla tudo isso, conforme a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018). Ao usar o Orbi, você também concorda com os {terms}.",
    sections: [
      {
        id: "who",
        title: "Quem cuida dos seus dados",
        body: [
          "O Orbi é um projeto independente feito no Brasil e é o controlador dos seus dados pessoais. Para qualquer assunto de privacidade, inclusive como encarregado (DPO), escreva para {email}.",
        ],
      },
      {
        id: "collect",
        title: "Dados que coletamos",
        body: ["Coletamos só o necessário para o Orbi funcionar:"],
        list: [
          "Conta: e-mail, nome e senha (guardada de forma criptografada pelo nosso provedor de login; ninguém do Orbi tem acesso a ela). Se você entrar com o Google, recebemos o nome, o e-mail e a foto que o Google compartilha.",
          "Perfil: nome de usuário, nome de exibição, bio, localização, site e pronomes (todos opcionais, menos o usuário), foto, capa, sticker, favoritos, idioma e preferências como perfil invisível e conteúdo adulto.",
          "O que você registra: status, notas, curtidas, reviews, datas, episódios vistos, listas, comentários, anexos de reviews, pessoas que você segue, denúncias que você envia e obras que você adiciona ao catálogo.",
          "Importação do Letterboxd: o arquivo .zip é lido só para trazer seus registros; o arquivo em si não é guardado.",
          "Aparelhos: o tipo de navegador e de sistema (por exemplo, \"Chrome · Windows\") e a data do primeiro acesso, para avisar você quando sua conta entrar num aparelho novo. Não guardamos seu endereço IP nessa lista.",
          "Dados técnicos: nossos provedores de hospedagem e banco de dados registram dados como endereço IP, data e hora das requisições, por segurança e para o serviço funcionar.",
        ],
      },
      {
        id: "not-collect",
        title: "O que não coletamos",
        body: [
          "Não pedimos CPF, endereço, telefone nem dados de pagamento, não usamos sua localização precisa e não tratamos dados sensíveis (como saúde, religião ou opinião política) de propósito. Não vendemos seus dados, não mostramos anúncios e não usamos ferramentas de rastreamento ou de análise de terceiros.",
        ],
      },
      {
        id: "use",
        title: "Para que usamos e com qual base legal",
        list: [
          "Criar e manter sua conta, guardar e mostrar o que você registra, enviar e-mails da conta (confirmação e redefinição de senha) e exibir seu perfil para outras pessoas: execução do contrato, isto é, destes termos (LGPD, art. 7º, V).",
          "Segurança, como o aviso de aparelho novo, a prevenção de abusos e a análise de denúncias: legítimo interesse (art. 7º, IX) e cumprimento de obrigação legal (art. 7º, II).",
          "Responder a pedidos de autoridades: cumprimento de obrigação legal ou ordem judicial.",
        ],
        body: [],
      },
      {
        id: "public",
        title: "O que fica público",
        body: [
          "Seu perfil, seus registros, notas, reviews, listas, comentários, curtidas e quem você segue podem ser vistos por qualquer pessoa, inclusive sem conta. Se você deixar o perfil invisível nas {settings}, só você vê seu perfil e suas atividades. Seu e-mail nunca aparece para outras pessoas.",
        ],
      },
      {
        id: "share",
        title: "Com quem compartilhamos",
        body: ["Não vendemos nem alugamos dados. Eles passam apenas por:"],
        list: [
          "Supabase (banco de dados, login e armazenamento de arquivos) e Vercel (hospedagem do site), que tratam os dados em nosso nome.",
          "Google, apenas se você escolher entrar com a conta do Google.",
          "TMDB, AniList, Open Library e Steam: as imagens e informações das obras são carregadas dos servidores deles, que recebem o seu endereço IP, como acontece em qualquer site que mostra imagens de outro lugar.",
          "YouTube (youtube-nocookie.com): só quando você clica para ver um trailer.",
          "MyMemory: só quando você clica em Traduzir numa review; o texto da review é enviado para tradução.",
          "Autoridades públicas, quando a lei ou uma ordem judicial exigir.",
        ],
      },
      {
        id: "transfer",
        title: "Transferência para outros países",
        body: [
          "Alguns desses provedores guardam dados em servidores fora do Brasil, como nos Estados Unidos. Essa transferência acontece para executar o serviço que você pediu (LGPD, art. 33) e com provedores que adotam medidas de segurança e cláusulas de proteção de dados.",
        ],
      },
      {
        id: "retention",
        title: "Por quanto tempo guardamos",
        body: [
          "Guardamos seus dados enquanto sua conta existir. Quando você exclui a conta, apagamos na hora o perfil, os registros, as reviews, as listas, os comentários, as curtidas, os seguidores, os aparelhos, as fotos e os anexos. Cópias de segurança dos provedores podem manter esses dados por um período limitado, até serem substituídas. Obras que você adicionou ao catálogo continuam disponíveis, mas sem ligação com você. Podemos guardar o mínimo necessário para cumprir a lei ou nos defender em processos.",
        ],
      },
      {
        id: "rights",
        title: "Seus direitos",
        body: [
          "Pela LGPD (art. 18), você pode: confirmar se tratamos seus dados e acessá-los; corrigir dados incompletos ou errados; pedir anonimização, bloqueio ou eliminação de dados desnecessários; receber uma cópia dos seus dados (portabilidade); saber com quem compartilhamos; revogar consentimentos; e se opor a tratamentos que descumpram a lei.",
          "Quase tudo você faz sozinho nas {settings}: editar o perfil, baixar uma cópia dos seus dados e excluir a conta. Para o resto, escreva para {email}; respondemos em até 15 dias. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).",
        ],
      },
      {
        id: "minors",
        title: "Crianças e adolescentes",
        body: [
          "O Orbi é para pessoas com 13 anos ou mais. Quem tem entre 13 e 17 anos precisa da autorização de um dos pais ou responsável. Se soubermos que uma conta é de alguém com menos de 13 anos, ela será excluída. Pais e responsáveis podem pedir a exclusão pelo {email}.",
        ],
      },
      {
        id: "security",
        title: "Segurança",
        body: [
          "Usamos conexão criptografada (HTTPS), senhas guardadas com criptografia e regras de acesso no banco de dados para que cada pessoa só altere o que é seu. Nenhum sistema é totalmente seguro; se acontecer um incidente que possa causar risco ou dano relevante, avisaremos você e a ANPD.",
        ],
      },
      {
        id: "cookies",
        title: "Cookies",
        body: ["Usamos apenas cookies necessários para o site funcionar e lembrar suas escolhas. Veja os detalhes na {cookies}."],
      },
      {
        id: "changes",
        title: "Mudanças nesta política",
        body: [
          "Podemos atualizar esta política. A data da versão em vigor fica no topo da página e, se a mudança for importante, avisaremos no site antes de ela valer.",
        ],
      },
    ],
  },
  terms: {
    title: "Termos de Uso",
    intro:
      "Estes termos são o acordo entre você e o Orbi. Ao criar uma conta ou usar o site, você concorda com eles e com a {privacy}. Se não concordar, não use o Orbi.",
    sections: [
      {
        id: "service",
        title: "O que é o Orbi",
        body: [
          "O Orbi é um serviço gratuito e independente para registrar e compartilhar o que você assiste, lê e joga. Ele está em desenvolvimento: funções podem mudar, ser suspensas ou encerradas, e o site pode ficar fora do ar às vezes.",
        ],
      },
      {
        id: "account",
        title: "Sua conta",
        list: [
          "Você precisa ter 13 anos ou mais. Entre 13 e 17 anos, só com a autorização de um dos pais ou responsável, que também responde pelo uso.",
          "Use dados verdadeiros e mantenha sua senha em segredo. Você responde pelo que for feito na sua conta.",
          "O nome de usuário não pode se passar por outra pessoa, marca ou empresa, nem ser ofensivo.",
        ],
        body: [],
      },
      {
        id: "content",
        title: "O seu conteúdo",
        body: [
          "Reviews, notas, listas, comentários e imagens que você publica continuam sendo seus. Ao publicar, você dá ao Orbi uma licença gratuita, mundial e não exclusiva para guardar, exibir, adaptar o formato (por exemplo, gerar miniaturas ou traduzir quando alguém pede) e mostrar esse conteúdo dentro do Orbi, enquanto ele estiver publicado.",
          "Você garante que tem o direito de publicar o que envia. Obras que você adiciona ao catálogo ficam disponíveis para todos, inclusive depois que você excluir a conta.",
        ],
      },
      {
        id: "rules",
        title: "O que não é permitido",
        list: [
          "Publicar conteúdo ilegal, discurso de ódio, assédio, ameaças ou incentivo à violência.",
          "Publicar nudez ou conteúdo sexual explícito; qualquer conteúdo sexual envolvendo menores é removido e comunicado às autoridades.",
          "Expor dados pessoais de outras pessoas ou se passar por alguém.",
          "Enviar conteúdo pirata ou links para ele, ou usar imagens e textos sem ter direito.",
          "Criar reviews falsas ou manipular notas, curtidas e seguidores com contas falsas ou automação.",
          "Fazer spam ou propaganda em massa.",
          "Tentar invadir, sobrecarregar ou copiar o site em massa, ou burlar limites e regras de acesso.",
        ],
        body: [],
      },
      {
        id: "moderation",
        title: "Denúncias e moderação",
        body: [
          "Use o botão Denunciar no menu de reviews, comentários e listas; para perfis, escreva para {email}. Podemos remover conteúdos e suspender ou excluir contas que descumpram estes termos ou a lei, e sempre que possível avisamos o motivo.",
        ],
      },
      {
        id: "copyright",
        title: "Direitos autorais e pedidos de remoção",
        body: [
          "Se algum conteúdo no Orbi viola seus direitos (inclusive imagens), escreva para {email} com o link do conteúdo, o motivo e um meio de contato. Analisamos todos os pedidos e removemos o que for procedente.",
        ],
      },
      {
        id: "third-party",
        title: "Conteúdo de terceiros",
        body: [
          "Títulos, sinopses, pôsteres, capas e outros dados das obras vêm do TMDB, do AniList, da Open Library e da Steam e pertencem aos seus titulares; são usados só para identificar as obras. Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB. O Orbi não é afiliado a nenhum desses serviços nem ao Letterboxd.",
          "Notas e reviews são opiniões de quem as escreveu, não do Orbi. Não respondemos pelo conteúdo de sites externos para onde houver links.",
        ],
      },
      {
        id: "warranty",
        title: "Garantias e responsabilidade",
        body: [
          "O Orbi é oferecido como está, sem garantia de que ficará sempre disponível, sem erros ou com informações das obras sempre corretas. Na medida permitida pela lei, não respondemos por perda de dados, indisponibilidade ou conteúdo publicado por usuários. Recomendamos baixar uma cópia dos seus dados de vez em quando, nas {settings}. Nada aqui limita direitos que você tenha pelo Código de Defesa do Consumidor.",
        ],
      },
      {
        id: "end",
        title: "Encerramento",
        body: [
          "Você pode excluir sua conta quando quiser, nas {settings}. Podemos encerrar contas que descumpram estes termos ou a lei.",
        ],
      },
      {
        id: "changes",
        title: "Mudanças nestes termos",
        body: [
          "Podemos atualizar estes termos. A data da versão em vigor fica no topo da página e, se a mudança for importante, avisaremos no site antes de ela valer. Continuar usando o Orbi depois disso significa aceitar a nova versão.",
        ],
      },
      {
        id: "law",
        title: "Lei aplicável e contato",
        body: [
          "Estes termos seguem as leis do Brasil, e fica eleito o foro do seu domicílio. Dúvidas, sugestões ou reclamações: {email}.",
        ],
      },
    ],
  },
  cookies: {
    title: "Política de Cookies",
    intro:
      "Cookies são pequenos arquivos que o site guarda no seu navegador. O Orbi usa apenas cookies e armazenamento local necessários para funcionar e lembrar suas escolhas. Não usamos cookies de publicidade, de rastreamento nem de análise, e por isso não pedimos consentimento.",
    sections: [
      {
        id: "cookies",
        title: "Cookies que usamos",
        body: [],
        items: [
          ["sb-…-auth-token", "Mantém você conectado (Supabase). Dura até você sair da conta ou a sessão expirar."],
          ["orbi_locale", "Idioma escolhido. 1 ano."],
          ["orbi-device", "Marca este navegador como já conhecido, para o aviso de \"novo aparelho\" na sua conta. 1 ano."],
          ["orbi-notifications-seen, orbi-notif-read, orbi-notif-unread, orbi-notif-deleted, orbi-notif-gone", "Lembram quais notificações você já viu, marcou como lidas ou não lidas e apagou. 1 ano."],
          ["orbi-welcome-seen", "Lembra que você já viu as boas-vindas do Orbi. 1 ano."],
        ],
      },
      {
        id: "storage",
        title: "Armazenamento local",
        body: ["Alguns ajustes ficam só no seu navegador e nunca são enviados para nós:"],
        items: [
          ["orbi-theme, orbi-theme-custom", "Tema e cores que você escolheu."],
          ["orbi-login", "Seu e-mail ou usuário, só se você marcar \"Lembrar de mim\" ao entrar."],
          ["orbi-nav-history", "Páginas abertas nesta aba, para o botão Voltar funcionar. Some quando você fecha a aba."],
        ],
      },
      {
        id: "third-party",
        title: "Cookies de terceiros",
        body: [
          "O Orbi não coloca cookies de terceiros. Se você clicar para ver um trailer, o vídeo vem do YouTube no modo de privacidade reforçada (youtube-nocookie.com), que pode guardar dados no navegador conforme a política do Google. Ao entrar com o Google, a página de login do Google usa os cookies dela.",
        ],
      },
      {
        id: "control",
        title: "Como controlar",
        body: [
          "Você pode apagar ou bloquear cookies nas configurações do navegador, mas sem o cookie de sessão não é possível entrar na conta. Sair da conta apaga o cookie de sessão. Dúvidas: {email}. Veja também a {privacy}.",
        ],
      },
    ],
  },
};

export default pt;
