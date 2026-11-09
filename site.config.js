/**
 * site.config.js
 * Configurações da empresa MaqCapas e ambiente de deploy.
 * 
 * ATENÇÃO: Campos com [CONFIRMAR COM O CLIENTE] são marcadores obrigatórios
 * para dados não fornecidos formalmente pelo cliente.
 * O script `npm run audit:prod` reprova estritamente caso estes marcadores
 * continuem presentes no ambiente de produção.
 */

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  // Domínio canônico do site
  domain: process.env.SITE_DOMAIN || 'https://maqcapas.com.br',

  // Dados da Empresa (Não inventados - aguardando confirmação do cliente)
  company: {
    name: 'MaqCapas',
    brandName: 'MAQCAPAS',
    tagline: 'Comércio de Capas Sob Medida &bull; Desde 1987',
    description: 'Fabricação sob medida de capas protetoras para informática, vestidos de noiva, ternos e máquinas industriais. Confecção própria desde 1987 em Curitiba/PR.',
    
    // Dados Cadastrais e Legais
    cnpj: process.env.COMPANY_CNPJ || '[CONFIRMAR COM O CLIENTE]',
    razaoSocial: process.env.COMPANY_RAZAO_SOCIAL || '[CONFIRMAR COM O CLIENTE]',
    
    // Localização & Contato
    endereco: process.env.COMPANY_ENDERECO || '[CONFIRMAR COM O CLIENTE]',
    cidade: 'Curitiba',
    estado: 'PR',
    cep: process.env.COMPANY_CEP || '[CONFIRMAR COM O CLIENTE]',
    pais: 'Brasil',
    paisCode: 'BR',
    email: process.env.COMPANY_EMAIL || '[CONFIRMAR COM O CLIENTE]',
    horario: process.env.COMPANY_HORARIO || '[CONFIRMAR COM O CLIENTE]',
    
    // Telefone e WhatsApp oficiais
    telefone: '+55 41 99934-3814',
    telefoneRaw: '+5541999343814',
    telefoneDisplay: '(41) 99934-3814',
    whatsappNumber: '5541999343814',
    
    // Ano de Fundação
    foundingYear: 1987
  },

  // Redes / Metadados
  meta: {
    themeColor: '#181614',
    ogImageWidth: 1200,
    ogImageHeight: 630,
    twitterCard: 'summary_large_image',
    locale: 'pt_BR',
    lang: 'pt-BR'
  }
};
