import type { PageIndex } from '@/types/passport';

export type Language = 'pt' | 'es';
export type CrestStoryTopic = 'colibri' | 'tangerine';

export interface PageTranslation {
  readonly index: PageIndex;
  readonly label: string;
  readonly shortLabel: string;
  readonly description: string;
}

export interface Translations {
  readonly langName: string;
  readonly countryName: string;
  readonly countryLine1: string;
  readonly countryLine2: string;
  readonly passportTitle: string;
  readonly passportNoLabel: string;
  readonly inspectButton: string;
  readonly restOnDeskButton: string;
  readonly signButton: string;
  readonly signingActiveButton: string;
  readonly crestStoryButton: string;
  readonly prevButton: string;
  readonly nextButton: string;
  readonly pages: readonly PageTranslation[];
  readonly hotspotColibri: string;
  readonly hotspotTangerine: string;
  readonly signatureModal: {
    readonly title: string;
    readonly subtitle: string;
    readonly clear: string;
    readonly cancel: string;
    readonly apply: string;
  };
  readonly crestStory: {
    readonly title: string;
    readonly subtitle: string;
    readonly close: string;
    readonly colibri: {
      readonly tab: string;
      readonly heading: string;
      readonly body: string;
    };
    readonly tangerine: {
      readonly tab: string;
      readonly heading: string;
      readonly body: string;
    };
    readonly dateCaption: string;
  };
  readonly textures: {
    readonly sig1Label: string;
    readonly sig2Label: string;
    readonly legalLine1: string;
    readonly legalLine2: string;
    readonly bearer1Label: string;
    readonly bearer2Label: string;
    readonly birthplaceLabel: string;
    readonly nationalityLabel: string;
    readonly nationalityValue: string;
    readonly issueDateLabel: string;
    readonly issueDateValue: string;
    readonly expiryDateLabel: string;
    readonly expiryDateValue: string;
    readonly authorityLabel: string;
    readonly authorityValue: string;
    readonly antiguaCaption: string;
    readonly endorsementsTitle: string;
    readonly notesHeading: string;
    readonly noteJointPassport: string;
    readonly noteIssue: string;
    readonly sdqPageTitle: string;
    readonly sdqCityLabel: string;
    readonly sdqClassLabel: string;
    readonly sdqClassValue: string;
    readonly sdqStatusValue: string;
  };
}

export const I18N: Record<Language, Translations> = {
  pt: {
    langName: 'Português',
    countryName: 'REPÚBLICA DAS TANGERINAS',
    countryLine1: 'REPÚBLICA DAS',
    countryLine2: 'TANGERINAS',
    passportTitle: 'PASSAPORTE',
    passportNoLabel: 'PASSAPORTE Nº',
    inspectButton: 'Pegar & Inspecionar',
    restOnDeskButton: 'Pousar na Mesa',
    signButton: 'Assinar Passaporte',
    signingActiveButton: 'Assinando (Câmera Travada)',
    crestStoryButton: 'História do Brasão',
    prevButton: '← Anterior',
    nextButton: 'Próxima →',
    pages: [
      {
        index: 0,
        label: 'Capa Fechada',
        shortLabel: 'Capa',
        description: 'Couro azul-marinho com hot-stamping dourado',
      },
      {
        index: 1,
        label: 'Perfil & Assinaturas',
        shortLabel: 'Perfil',
        description: 'Marcos (Brasil) & Allison (Honduras) • MA060826',
      },
      {
        index: 2,
        label: 'Visto Guatemala',
        shortLabel: 'Guatemala',
        description: 'Carimbos IGM (17 & 19 Out 2026) • Antigua Guatemala',
      },
      {
        index: 3,
        label: 'Residência Santo Domingo',
        shortLabel: 'SDQ',
        description: 'Visto de residência — República Dominicana',
      },
    ],
    hotspotColibri: 'O Colibri',
    hotspotTangerine: 'A Tangerina',
    signatureModal: {
      title: 'Assinaturas dos Titulares',
      subtitle: 'Câmera 3D travada (Touch Isolation) — cada titular pode assinar no seu campo abaixo',
      clear: 'Limpar',
      cancel: 'Cancelar',
      apply: 'Aplicar no Passaporte',
    },
    crestStory: {
      title: 'O Brasão da República das Tangerinas',
      subtitle: 'Os símbolos que guardam a nossa história',
      close: 'Fechar',
      colibri: {
        tab: 'Os Colibris',
        heading: 'Dois Colibris em Voo',
        body: 'Os dois colibris simétricos que guardam o escudo representam a leveza, a devoção e a coragem de atravessar fronteiras. Assim como essas pequenas aves capazes de voar longas distâncias guiadas pelo coração, cada viagem entre o Brasil e Honduras nos lembra que o amor encontra sempre o caminho de volta para casa.',
      },
      tangerine: {
        tab: 'A Tangerina',
        heading: 'A Tangerina no Coração do Escudo',
        body: 'No centro do brasão brilha a tangerina — símbolo de calor, doçura e dos pequenos momentos compartilhados que tornam a vida vibrante. Dividida em gomos feitos para serem aproveitados juntos, ela representa a nossa própria "República": um lar feito de afeto, risadas e novas memórias pelo mundo.',
      },
      dateCaption: 'Data comemorativa gravada na faixa: 06.08.2026',
    },
    textures: {
      sig1Label: 'Assinatura do Titular 1 / Bearer 1 Signature',
      sig2Label: 'Assinatura do Titular 2 / Bearer 2 Signature',
      legalLine1: 'Este passaporte deve ser assinado pelos titulares,',
      legalLine2: 'salvo em caso de incapacidade.',
      bearer1Label: 'TITULAR 01 / BEARER 01',
      bearer2Label: 'TITULAR 02 / BEARER 02',
      birthplaceLabel: 'LOCAL DE NASCIMENTO / PLACE OF BIRTH',
      nationalityLabel: 'NACIONALIDADE / NATIONALITY',
      nationalityValue: 'TANGERINENSE • BRA / HND',
      issueDateLabel: 'DATA DE EMISSÃO / DATE OF ISSUE',
      issueDateValue: '06 AGO/AUG 2026',
      expiryDateLabel: 'VÁLIDO ATÉ / DATE OF EXPIRY',
      expiryDateValue: '06 AGO/AUG 2036',
      authorityLabel: 'AUTORIDADE / AUTHORITY',
      authorityValue: 'MIN. DAS TANGERINAS / TNG',
      antiguaCaption: 'Antigua Guatemala • Outubro 2026',
      endorsementsTitle: 'OBSERVAÇÕES / ENDORSEMENTS',
      notesHeading: 'Notas Diplomáticas',
      noteJointPassport: '• Passaporte Conjunto Nº',
      noteIssue: '• Emissão Comemorativa:',
      sdqPageTitle: 'VISTO DE RESIDÊNCIA — SANTO DOMINGO',
      sdqCityLabel: 'CIDADE / CITY',
      sdqClassLabel: 'CATEGORIA / CLASS',
      sdqClassValue: 'RESIDÊNCIA PERMANENTE',
      sdqStatusValue: 'APROVADO • MÚLTIPLAS ENTRADAS',
    },
  },
  es: {
    langName: 'Español',
    countryName: 'REPÚBLICA DE LAS TANGERINAS',
    countryLine1: 'REPÚBLICA DE LAS',
    countryLine2: 'TANGERINAS',
    passportTitle: 'PASAPORTE',
    passportNoLabel: 'PASAPORTE Nº',
    inspectButton: 'Tomar e Inspeccionar',
    restOnDeskButton: 'Dejar en la Mesa',
    signButton: 'Firmar Pasaporte',
    signingActiveButton: 'Firmando (Cámara Bloqueada)',
    crestStoryButton: 'Historia del Escudo',
    prevButton: '← Anterior',
    nextButton: 'Siguiente →',
    pages: [
      {
        index: 0,
        label: 'Portada Cerrada',
        shortLabel: 'Portada',
        description: 'Cuero azul marino con estampado dorado',
      },
      {
        index: 1,
        label: 'Perfil y Firmas',
        shortLabel: 'Perfil',
        description: 'Marcos (Brasil) y Allison (Honduras) • MA060826',
      },
      {
        index: 2,
        label: 'Visa Guatemala',
        shortLabel: 'Guatemala',
        description: 'Sellos IGM (17 y 19 Oct 2026) • Antigua Guatemala',
      },
      {
        index: 3,
        label: 'Residencia Santo Domingo',
        shortLabel: 'SDQ',
        description: 'Visa de residencia — República Dominicana',
      },
    ],
    hotspotColibri: 'El Colibrí',
    hotspotTangerine: 'La Mandarina',
    signatureModal: {
      title: 'Firmas de los Titulares',
      subtitle: 'Cámara 3D bloqueada (Touch Isolation) — cada titular puede firmar en su espacio',
      clear: 'Borrar',
      cancel: 'Cancelar',
      apply: 'Aplicar al Pasaporte',
    },
    crestStory: {
      title: 'El Escudo de la República de las Tangerinas',
      subtitle: 'Los símbolos que guardan nuestra historia',
      close: 'Cerrar',
      colibri: {
        tab: 'Los Colibríes',
        heading: 'Dos Colibríes en Vuelo',
        body: 'Los dos colibríes simétricos que resguardan el escudo simbolizan la ligereza, la devoción y la valentía de cruzar fronteras. Como estas pequeñas aves capaces de recorrer grandes distancias guiadas por el corazón, cada viaje entre Honduras y Brasil nos recuerda que el amor siempre encuentra el camino de vuelta a casa.',
      },
      tangerine: {
        tab: 'La Tangerina',
        heading: 'La Tangerina en el Corazón del Escudo',
        body: 'En el centro del escudo brilla la tangerina — símbolo de calidez, dulzura y de los pequeños instantes compartidos que llenan la vida de color. Dividida en gajos hechos para disfrutarse juntos, representa nuestra propia "República": un hogar construido con cariño, risas y recuerdos por el mundo.',
      },
      dateCaption: 'Fecha conmemorativa grabada en la cinta: 06.08.2026',
    },
    textures: {
      sig1Label: 'Firma del Titular 1 / Bearer 1 Signature',
      sig2Label: 'Firma del Titular 2 / Bearer 2 Signature',
      legalLine1: 'Este pasaporte debe ser firmado por los titulares,',
      legalLine2: 'salvo en caso de incapacidad.',
      bearer1Label: 'TITULAR 01 / BEARER 01',
      bearer2Label: 'TITULAR 02 / BEARER 02',
      birthplaceLabel: 'LUGAR DE NACIMIENTO / PLACE OF BIRTH',
      nationalityLabel: 'NACIONALIDAD / NATIONALITY',
      nationalityValue: 'TANGERINENSE • BRA / HND',
      issueDateLabel: 'FECHA DE EMISIÓN / DATE OF ISSUE',
      issueDateValue: '06 AGO/AUG 2026',
      expiryDateLabel: 'VÁLIDO HASTA / DATE OF EXPIRY',
      expiryDateValue: '06 AGO/AUG 2036',
      authorityLabel: 'AUTORIDAD / AUTHORITY',
      authorityValue: 'MIN. DE LAS TANGERINAS / TNG',
      antiguaCaption: 'Antigua Guatemala • Octubre 2026',
      endorsementsTitle: 'OBSERVACIONES / ENDORSEMENTS',
      notesHeading: 'Notas Diplomáticas',
      noteJointPassport: '• Pasaporte Conjunto Nº',
      noteIssue: '• Emisión Conmemorativa:',
      sdqPageTitle: 'VISA DE RESIDENCIA — SANTO DOMINGO',
      sdqCityLabel: 'CIUDAD / CITY',
      sdqClassLabel: 'CATEGORÍA / CLASS',
      sdqClassValue: 'RESIDENCIA PERMANENTE',
      sdqStatusValue: 'APROBADO • MÚLTIPLES ENTRADAS',
    },
  },
};
