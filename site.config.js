/**
 * site.config.js
 * Configurações da empresa MaqCapas e ambiente de deploy.
 */

module.exports = {
  domain: process.env.SITE_DOMAIN || 'https://maqcapas.com.br',

  company: {
    name: 'MaqCapas',
    brandName: 'MAQCAPAS',
    tagline: 'Comércio de Capas Sob Medida &bull; Desde 1987',
    description: 'Fabricação sob medida de capas protetoras para informática, vestidos de noiva, ternos e máquinas industriais. Confecção própria desde 1987 em Curitiba/PR.',
    
    // Dados de contato oficiais informados pelo cliente
    email: 'luizmarnunes18@gmail.com',
    telefone: '+55 41 9934-3814',
    telefoneRaw: '+554199343814',
    telefoneDisplay: '(41) 9934-3814',
    whatsappNumber: '554199343814',
    
    cidade: 'Curitiba',
    estado: 'PR',
    pais: 'Brasil',
    paisCode: 'BR',
    foundingYear: 1987
  },

  meta: {
    themeColor: '#181614',
    ogImageWidth: 1200,
    ogImageHeight: 630,
    twitterCard: 'summary_large_image',
    locale: 'pt_BR',
    lang: 'pt-BR'
  }
};
