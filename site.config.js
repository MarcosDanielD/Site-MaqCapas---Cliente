/**
 * site.config.js
 * Configurações da empresa MaqCapas e ambiente de deploy.
 */

module.exports = {
  domain: process.env.SITE_DOMAIN || 'https://maqcapas.com.br',

  company: {
    name: 'MAQCAPAS',
    brandName: 'MAQCAPAS',
    tagline: 'Capas para Proteção',
    description: 'Fabricação de capas para proteção: capas para vestidos de festas, vestidos de noivas, daminhas, ternos e capas sob medida para equipamentos em Curitiba/PR.',
    
    // Dados de contato oficiais informados pelo cliente
    email: 'luizmarnunes18@gmail.com',
    telefone: '+55 41 99934-3814',
    telefoneRaw: '+5541999343814',
    telefoneDisplay: '(41) 99934-3814',
    whatsappNumber: '5541999343814',
    
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
