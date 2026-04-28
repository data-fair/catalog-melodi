/**
 * Table de correspondance entre les codes techniques SDMX de l'INSEE
 * et des abréviations courtes, stables et parlantes.
 *
 * Contient les variables avec cardinalité < 10 par dataset,
 * plus les variables avec cardinalité entre 10 et 29.
 * Généré automatiquement à partir de l'API Mélodi.
 */

export const labelMapping: Record<string, Record<string, string>> = {
  // AGE
  AGE: {
    Y1T14: '1_14a',
    Y2T5: '2_5a',
    Y5T9: '5_9a',
    Y6T10: '6_10a',
    Y10T14: '10_14a',
    Y11T14: '11_14a',
    Y15T17: '15_17a',
    Y15T19: '15_19a',
    Y15T24: '15_24a',
    Y15T64: '15_64a',
    Y18T24: '18_24a',
    Y20T24: '20_24a',
    Y20T64: '20_64a',
    Y25T29: '25_29a',
    Y25T34: '25_34a',
    Y25T39: '25_39a',
    Y25T49: '25_49a',
    Y25T54: '25_54a',
    Y25T59: '25_59a',
    Y30T34: '30_34a',
    Y30T39: '30_39a',
    Y35T39: '35_39a',
    Y35T49: '35_49a',
    Y40T44: '40_44a',
    Y40T49: '40_49a',
    Y40T50: '40_50a',
    Y40T54: '40_54a',
    Y45T49: '45_49a',
    Y50T54: '50_54a',
    Y50T59: '50_59a',
    Y50T64: '50_64a',
    Y55T59: '55_59a',
    Y55T64: '55_64a',
    Y60T64: '60_64a',
    Y65T69: '65_69a',
    Y65T74: '65_74a',
    Y65T79: '65_79a',
    Y70T74: '70_74a',
    Y75T79: '75_79a',
    Y75T84: '75_84a',
    Y80T84: '80_84a',
    Y85T89: '85_89a',
    Y90T94: '90_94a',
    Y_GE15: '15plus_a',
    Y_GE30: '30plus_a',
    Y_GE55: '55plus_a',
    Y_GE60: '60plus_a',
    Y_GE65: '65plus_a',
    Y_GE75: '75plus_a',
    Y_GE80: '80plus_a',
    Y_GE85: '85plus_a',
    Y_GE95: '95plus_a',
    Y_LE24: '24m_a',
    Y_LT5: 'm5a',
    Y_LT15: 'm15a',
    Y_LT20: 'm20a',
    Y_LT25: 'm25a',
    Y_LT30: 'm30a',
    _T: 'tot',
    _Z: 'age_na',
  },
  // AGE_RF
  AGE_RF: {
    Y30T39: '30_39a',
    Y40T49: '40_49a',
    Y50T59: '50_59a',
    Y60T74: '60_74a',
    Y_GE75: '75plus_a',
    Y_LT30: 'm30a',
    _T: 'tot',
  },
  // AIRCOND
  AIRCOND: {
    0: 'sans_clim',
    1: 'clim',
    _T: 'tot',
  },
  // BAINWC
  BAINWC: {
    0: 'sans_bain_wc',
    1: 'bain_wc',
    _T: 'tot',
  },
  // BASE_PER
  BASE_PER: {
    2025: 'a2025',
  },
  // BOARDING_SCHOOL
  BOARDING_SCHOOL: {
    0: 'sans_internat',
    1: 'internat',
    _T: 'tot',
    _U: 'indet',
    _Z: 'so',
  },
  // BPE_MEASURE
  BPE_MEASURE: {
    CAPACITY: 'cap',
    FACILITIES: 'nb_eq',
    PLAYGROUNDS: 'nb_jeu',
    ROOMS: 'nb_sal_ct',
  },
  // BUILD_END
  BUILD_END: {
    Y1919T1945: '1919_1945',
    Y1946T1970: '1946_1970',
    Y1971T1990: '1971_1990',
    Y1991T2005: '1991_2005',
    Y2006TAAAA: 'ap_2006',
    Y_LT1919: 'av_1919',
    _T: 'tot',
  },
  // CANTEEN
  CANTEEN: {
    0: 'sans_cantine',
    1: 'cantine',
    _T: 'tot',
    _U: 'indet',
    _Z: 'so',
  },
  // CARPARK
  CARPARK: {
    0: 'sans_park',
    1: 'park',
    _T: 'tot',
  },
  // CARS
  CARS: {
    C0: '0_voit',
    C1: '1_voit',
    C_GE2: '2plus_voit',
    _T: 'tot',
  },
  // CIVIL_STATUS
  CIVIL_STATUS: {
    1: 'mar',
    2: 'pacs',
    3: 'conc',
    4: 'veuf',
    5: 'div',
    6: 'celib',
    _T: 'tot',
  },
  // COUPLE
  COUPLE: {
    0: 'seul',
    1: 'cpl',
    _T: 'tot',
  },
  // CPGE
  CPGE: {
    0: 'sans_cpge',
    1: 'cpge',
    _T: 'tot',
    _Z: 'so',
  },
  // DERA_MEASURE
  DERA_MEASURE: {
    SALAIRE_NET_EQTP_MENSUEL_MOYENNE: 'sal_eqtp_moy',
  },
  // DTH_PLACE
  DTH_PLACE: {
    1: 'dom',
    2: 'etab_san',
    3: 'ehpad',
    4: 'pub',
    5: 'aut',
    _T: 'tot',
  },
  // ECONOMIC_SPHERE
  ECONOMIC_SPHERE: {
    PRESENTIAL: 'sph_pres',
    PRODUCTIVE: 'sph_prod',
    _T: 'tot',
  },
  // EC_MEASURE
  EC_MEASURE: {
    AVERAGE_MOTHER: 'age_moy_mere',
    BRTHRT: 'tx_natal',
    DIV: 'nb_div',
    DTH: 'nb_dec',
    DTH_CUMR: 'nb_dec_cum',
    DTH_MEAN1: 'moy_dec_j',
    DTH_MEAN2: 'moy_dec_7j',
    DTH_PLACE_REG: 'nb_dec_etab',
    DTH_PLACE_RES: 'nb_dec_dom',
    FERIND: 'ind_fec',
    FERRT: 'tx_fec',
    LEXPEC: 'esp_vie',
    LVB: 'nb_nais',
    LVB_CUMR: 'nb_nais_cum',
    LVB_MEAN1: 'moy_nais_j',
    LVB_PLACE_REG: 'nb_nais_etab',
    LVB_PLACE_RES: 'nb_nais_dom',
    MARRT: 'tx_nupt',
    MAR_DOM: 'nb_mar_dom',
    MAR_REG: 'nb_mar_reg',
    MOR_BRUT_RT: 'tx_mort_brut',
    MOR_INF_RT: 'tx_mort_inf',
    MOR_INF_RT_3Y: 'tx_mort_inf_3a',
    MOR_RT: 'tx_mort',
    MOR_RT_ANNUALIZED: 'tx_mort_ann',
    MOR_STANDARD_RT: 'tx_mort_std',
    PACS: 'nb_pacs',
  },
  // EDUC
  EDUC: {
    '001T003_RP': 'sans_dip',
    '001T100_RP': 'sd_cep',
    '001T200_RP': 'sd_bepc',
    '100_RP': 'cep',
    '200_RP': 'bepc',
    '300_RP': 'cap_bep',
    '350T351_RP': 'bac',
    '500T702_RP': 'sup',
    '500_RP': 'sup_c',
    '600T702_RP': 'univ_2_3',
    '600_RP': 'lic',
    '700_RP': 'sup_5',
    _T: 'tot',
  },
  // ELEC
  ELEC: {
    0: 'sans_elec',
    1: 'elec',
    _T: 'tot',
  },
  // EMPFORM
  EMPFORM: {
    1: 'ns',
    11: 'ind',
    12: 'pat',
    13: 'af',
    2: 'sal',
    211: 'cdi',
    22: 'cdd',
    '23_25': 'app_stage',
    24: 'emp_jeun',
    26: 'int',
    _T: 'tot',
  },
  // EMPSTA_ENQ
  EMPSTA_ENQ: {
    1: 'actocc',
    2: 'cho',
    31: 'ret',
    33: 'etu',
    35: 'foyer',
    36: 'inact',
    _T: 'tot',
  },
  // EMP_ACTIVITY
  EMP_ACTIVITY: {
    AZ: 'agri',
    BE: 'indust',
    FZ: 'btp',
    GU: 'serv_march',
    OQ: 'admin',
    _T: 'tot',
  },
  // EP
  EP: {
    0: 'hors_educ_prio',
    1: 'educ_prio',
    _T: 'tot',
    _Z: 'so',
  },
  // EP_MEASURE
  EP_MEASURE: {
    AVERAGE: 'age_moy',
    EVO_MIGRAT_POP_REF_PERIOD_RT: 'var_migr',
    EVO_NAT_POP_REF_PERIOD_RT: 'var_nat',
    EVO_POP_REF_PERIOD_RT: 'var_pop',
    MEDAGE: 'age_med',
    POP_JAN_1ST: 'pop_1jan',
    PT_IN_POP: 'part_pop',
    PT_YGE65_IN_Y20T64: 'r65_20_64',
  },
  // ERP_CATEGORY
  ERP_CATEGORY: {
    1: '1500plus',
    2: '701_1500',
    3: '301_700',
    4: '101_300',
    5: '100max',
    _U: 'indet',
    _Z: 'so',
  },
  // FACILITY_DOM
  FACILITY_DOM: {
    A: 'serv_part',
    B: 'comm',
    C: 'ens',
    D: 'sante',
    E: 'transp',
    F: 'sport_lois',
    G: 'tour',
    _T: 'tot',
  },
  // FACILITY_SDOM
  FACILITY_SDOM: {
    A1: 'serv_pub',
    A2: 'serv_gen',
    A3: 'serv_auto',
    A4: 'art_bat',
    A5: 'autr_serv',
    B1: 'gr_surf',
    B2: 'comm_alim',
    B3: 'comm_spec',
    C1: 'prim',
    C2: 'sec_1',
    C3: 'sec_2',
    C4: 'sup_non_univ',
    C5: 'sup_univ',
    C6: 'form_cont',
    C7: 'autr_ens',
    D1: 'etab_san',
    D2: 'med_lib',
    D3: 'autr_san',
    D4: 'ss_pa',
    D5: 'ss_pe',
    D6: 'ss_ph',
    D7: 'autr_ss',
    E1: 'infra_transp',
    F1: 'eq_sport',
    F2: 'eq_lois',
    F3: 'eq_cult',
    G1: 'tour',
    _T: 'tot',
  },
  // FILOSOFI_MEASURE
  FILOSOFI_MEASURE: {
    MED_SL: 'niv_vie_med',
    PR_MD60: 'tx_pauv',
  },
  // FLORES_MEASURE
  FLORES_MEASURE: {
    EMPL3112: 'eff_dec',
    UNIT_LOC: 'etab',
  },
  // FREE_ACCESS
  FREE_ACCESS: {
    0: 'restreint',
    1: 'libre',
    _U: 'indet',
    _Z: 'so',
  },
  // HOTEL_STA
  HOTEL_STA: {
    CI: 'chaine',
    HC: 'indep',
    _T: 'tot',
  },
  // IDX_TYPE
  IDX_TYPE: {
    CII: 'ind_conf',
    CPI: 'ipc',
  },
  // INDOOR
  INDOOR: {
    0: 'decouvert',
    1: 'couvert',
    _U: 'indet',
    _Z: 'so',
  },
  // IND_TYPE
  IND_TYPE: {
    IW: 'poids_p',
    IX: 'indice',
    M_VAR: 'var_mens',
    YOY: 'ga',
    YOY_CONTRIB: 'contrib_ga',
    Y_VAR: 'var_ann',
  },
  // LEGAL_FORM
  LEGAL_FORM: {
    10: 'ei',
    54: 'sarl',
    57: 'sas',
    ENTIND: 'ei_micro',
    ENTIND_X_MICRO: 'ei_hors_micro',
    MICRO: 'micro',
    OTH_SIDE: 'aut_soc',
    SOC: 'soc',
    X_MICRO: 'hors_micro',
    _T: 'tot',
  },
  // LEGAL_FORM_WITH_PUBLIC
  LEGAL_FORM_WITH_PUBLIC: {
    7: 'pe',
    '1T4': 'fp',
    '5T9X7': 'priv_hors_pe',
    '1T9X7': 'ens_hors_pe',
  },
  // LIGHTED
  LIGHTED: {
    0: 'obscur',
    1: 'eclaire',
    _U: 'indet',
    _Z: 'so',
  },
  // LOCKER_ROOM_ACCESSIBILITY
  LOCKER_ROOM_ACCESSIBILITY: {
    0: 'vest_inacc',
    1: 'vest_acc',
    _U: 'indet',
    _Z: 'so',
  },
  // L_STAY
  L_STAY: {
    LONG: 'ann',
    SHORT: 'pass',
    Y10T19: '10_19a',
    Y20T29: '20_29a',
    Y2T4: '2_4a',
    Y5T9: '5_9a',
    Y_GE30: '30plus_a',
    Y_LT2: 'm2a',
    _T: 'tot',
  },
  // MARSTA
  MARSTA: {
    DIV: 'div',
    MAR: 'mar',
    MARO: 'mar_hf',
    MARS: 'mar_hh',
    REP: 'pacs',
    _Z: 'na',
  },
  // MULTIPLEX_CINEMA
  MULTIPLEX_CINEMA: {
    0: 'mono',
    1: 'multiplex',
    _U: 'indet',
    _Z: 'so',
  },
  // NATIONALITY
  NATIONALITY: {
    150: 'eur',
    250: 'fr',
    276: 'all',
    380: 'ita',
    528: 'pb',
    56: 'bel',
    620: 'por',
    724: 'esp',
    TOUR_EUR_OTH: 'aut_eur',
    _T: 'tot',
  },
  // NCH
  NCH: {
    CH0_Y_LT25: '0_enf',
    CH1_Y_LT25: '1_enf',
    CH2_Y_LT25: '2_enf',
    CH3_Y_LT25: '3_enf',
    CH_GE4_Y_LT25: '4plus_enf',
    _T: 'tot',
  },
  // NOC
  NOC: {
    P1: '1_pers',
    _T: 'tot',
  },
  // NOR
  NOR: {
    R1: '1_p',
    R2: '2_p',
    R3: '3_p',
    R4: '4_p',
    R_GE5: '5plus_p',
    _T: 'tot',
  },
  // NRG_SRC
  NRG_SRC: {
    BOT_GAS: 'gaz_bout',
    ELC: 'elec',
    OIL: 'fioul',
    OTH: 'autr',
    TOWN_GAS: 'gaz_ville',
    _T: 'tot',
    _Z: 'hors_log',
  },
  // NUMBER_EMPL
  NUMBER_EMPL: {
    E0: '0_sal',
    E100T199: '100_199_sal',
    E10T19: '10_19_sal',
    E1T4: '1_4_sal',
    E1T9: '1_9_sal',
    E200T499: '200_499_sal',
    E20T49: '20_49_sal',
    E50T99: '50_99_sal',
    E5T9: '5_9_sal',
    E_GE50: '50plus_sal',
    E_GE500: '500plus_sal',
    _T: 'tot',
  },
  // OCC_IND
  OCC_IND: {
    MOD_OVER_OCC: 'sur_mod',
    MOD_UNDER_OCC: 'sous_mod',
    SEV_OVER_OCC: 'sur_fort',
    SEV_UNDER_OCC: 'sous_fort',
    STD_OCC: 'norm',
    VSEV_UNDER_OCC: 'sous_vf',
  },
  // OBS_STATUS
  OBS_STATUS: {
    A: 'norm',
    K: 'incl_autr',
    O: 'vm',
    W: 'incl_dans_autr',
  },
  // CONF_STATUS
  CONF_STATUS: {
    C: 'conf',
    F: 'diff',
  },
  // OCS
  OCS: {
    DW_MAIN: 'res_princ',
    DW_SEC_DW_OCC: 'res_sec_occ',
    DW_VAC: 'vac',
    _T: 'tot',
  },
  // PCS
  PCS: {
    1: 'agr',
    2: 'art',
    3: 'cad',
    4: 'pi',
    5: 'emp',
    6: 'ouv',
    7: 'ret',
    8: 'etu',
    9: 'inact',
    _T: 'tot',
  },
  // PCS_ESE
  PCS_ESE: {
    '1T3': 'cad_ce',
    4: 'pi',
    5: 'emp',
    6: 'ouv',
    _T: 'tot',
  },
  // PRACTICE_AREA_ACCESSIBILITY
  PRACTICE_AREA_ACCESSIBILITY: {
    0: 'prat_inacc',
    1: 'prat_acc',
    _U: 'indet',
    _Z: 'so',
  },
  // PREFPH
  PREFPH: {
    1: 'ref_men',
    _T: 'tot',
  },
  // PREV_RES_AREA
  PREV_RES_AREA: {
    11: 'mem_log',
    12: 'mem_com',
    '20_30': 'aut_com',
    21: 'aut_dep_reg',
    22: 'aut_reg',
    23: 'hors_reg',
    24: 'hors_dom',
    '25T32': 'hors_met',
    _T: 'tot',
  },
  // REU_ELECTION_TYPE
  REU_ELECTION_TYPE: {
    DEP_REG: 'dep_reg',
    EUR: 'eur',
    MUN: 'mun',
    PR: 'pres',
  },
  // REU_LIST_TYPE
  REU_LIST_TYPE: {
    LC: 'comp',
    LP: 'princ',
    _T: 'tot',
  },
  // REU_MEASURE
  REU_MEASURE: {
    EVO_REG_VOTERS: 'evo_inscr',
    EVO_RMV_VOTERS: 'evo_rad',
    EVO_VOTERS: 'evo_elect',
    PT_VOTERS_IN_POP: 'tx_inscr',
    VOTERS: 'nb_elect',
  },
  // REU_REASON_REG
  REU_REASON_REG: {
    REG_VOTERS_FN: 'nat_fr',
    REG_VOTERS_OTHER: 'aut_mot',
    REG_VOTERS_VOL: 'inscr_vol',
    REG_VOTERS_VOL_OL: 'inscr_net',
    REG_VOTERS_VOL_PR: 'inscr_pap',
    REG_VOTERS_Y_GE18: 'majeur',
    _T: 'tot',
    _Z: 'so',
  },
  // REU_REASON_RMV
  REU_REASON_RMV: {
    RMV_VOTERS_DEC: 'decede',
    RMV_VOTERS_MUN: 'rad_mun',
    RMV_VOTERS_NR: 'rad_ni',
    RMV_VOTERS_OTHER: 'aut_rad',
    _T: 'tot',
    _Z: 'so',
  },
  // RP_MEASURE
  RP_MEASURE: {
    POP: 'pop',
    DWELLINGS: 'log',
    DWELLINGS_POPSIZE: 'pop_men',
    BRTH: 'naiss_cum',
    DEATH: 'dec_cum',
    SUP: 'surf',
  },
  // RPI_TYPE
  RPI_TYPE: {
    C: 'conc',
    D: 'disp',
    _T: 'tot',
    _Z: 'so',
  },
  // SANITARY
  SANITARY: {
    0: 'sans_sanit',
    1: 'sanit',
    _U: 'indet',
    _Z: 'so',
  },
  // SANITARY_ACCESSIBILITY
  SANITARY_ACCESSIBILITY: {
    0: 'sanit_inacc',
    1: 'sanit_acc',
    _U: 'indet',
    _Z: 'so',
  },
  // SCHOOL_SECTOR
  SCHOOL_SECTOR: {
    PRIV: 'priv',
    PUBL: 'pub',
    _T: 'tot',
    _Z: 'so',
  },
  // SEASONAL_ADJUST
  SEASONAL_ADJUST: {
    N: 'brut',
    S: 'cvs',
    S_TAX: 'cvs_fisc',
    Y: 'cvs_cjo',
  },
  // SEASONAL_OPENING
  SEASONAL_OPENING: {
    0: 'perm',
    1: 'saison',
    _U: 'indet',
    _Z: 'so',
  },
  // SEX
  SEX: {
    F: 'fem',
    M: 'hom',
    _T: 'tot',
  },
  // SHOWER
  SHOWER: {
    0: 'sans_douche',
    1: 'douche',
    _U: 'indet',
    _Z: 'so',
  },
  // SIDE_MEASURE
  SIDE_MEASURE: {
    BURE: 'nb_nu',
    LEGAL_UNIT: 'nb_ul',
    UNIT_LOC: 'nb_etab',
    UNIT_LOC_BURE: 'nb_etab_nouv',
  },
  // SOBO
  SOBO: {
    0: 'sans_chauf_eau_sol',
    1: 'chauf_eau_sol',
    _T: 'tot',
  },
  // STUD
  STUD: {
    0: 'non_sco',
    1: 'inscr',
    _T: 'tot',
  },
  // STUD_AREA
  STUD_AREA: {
    _T: 'tot',
    _Z: 'hc',
  },
  // TDW
  TDW: {
    1: 'mais',
    '1_2_P': 'mais_dur',
    '1_2_W': 'mais_bois',
    2: 'apt',
    '3T6': 'aut_log',
    5: 'hab_fort',
    7: 'case_trad',
    _T: 'tot',
  },
  // TERRTYPO
  TERRTYPO: {
    1: 'idf',
    2: 'litt',
    3: 'mont',
    4: 'urb_prov',
    5: 'aut',
    N_CST: 'nlitt',
    _T: 'tot',
  },
  // TFN
  TFN: {
    11: 'pere_s',
    12: 'mere_s',
    21: 'cpl_sf',
    22: 'cpl_ef',
    220: 'recomp',
    223: 'trad',
    _T: 'tot',
  },
  // TOUR_MEASURE
  TOUR_MEASURE: {
    ARR: 'nb_arr',
    BEDPLACE: 'nb_lit',
    DAYS_STAY: 'nb_jour',
    NON_RESIDENT_NIGHTSPENT_RATIO: 'tx_nuit_etr',
    NUI: 'nb_nuit',
    PLACE: 'nb_place',
    PLACE_AVAIL: 'place_off',
    PLACE_OCCUPANCY_RATE: 'tx_occ',
    PLACE_USED: 'nb_place_occ',
    UNIT_LOC: 'nb_etab',
  },
  // TOUR_RESID
  TOUR_RESID: {
    142: 'asie',
    150: 'eur',
    156: 'chn',
    19: 'amer',
    '1_X_250': 'etr',
    2: 'afr',
    250: 'fr',
    276: 'all',
    380: 'ita',
    392: 'jpn',
    528: 'pb',
    '5_13': 'am_sud',
    643: 'rus',
    724: 'esp',
    756: 'sui',
    826: 'uk',
    840: 'usa',
    TOUR_PMO: 'moy_or',
    _T: 'tot',
  },
  // TPH
  TPH: {
    11: 'men_1p',
    110: 'hom_seul',
    111: 'fem_seul',
    12: 'men_nf',
    2: 'men_fam',
    MF21: 'fam_mono',
    MF221: 'cpl_sf',
    MF222: 'cpl_ef',
    _T: 'tot',
  },
  // TPH_CPI
  TPH_CPI: {
    IMPUTED_RENTS: 'loy_imp',
    URB_WORKERS_EMP: 'ouv_emp',
    _T: 'tot',
  },
  // TPH_FISCAL
  TPH_FISCAL: {
    110: 'hom_seul',
    111: 'fem_seul',
    21: 'fam_mono',
    '221_FILOSOFI': 'cpl_sf',
    '222_FILOSOFI': 'cpl_ef',
    3: 'men_compl',
    _T: 'tot',
  },
  // TRANS
  TRANS: {
    1: 'aucun',
    2: 'pied',
    3: 'velo',
    '3T4': '2_roues',
    4: '2rm',
    5: 'voit',
    6: 'tc',
    _T: 'tot',
  },
  // TSH
  TSH: {
    1: 'prop',
    100: 'prop',
    2: 'loc',
    211: 'loc_priv',
    '212_222': 'loc_mbl',
    221: 'loc_soc',
    300: 'log_grat',
    _T: 'tot',
  },
  // WKTIME
  WKTIME: {
    FT: 'tc',
    PT: 'tp',
    _T: 'tot',
  },
  // WORK_AREA
  WORK_AREA: {
    10: 'mem_com',
    '20_30': 'aut_com',
    21: 'aut_dep_reg',
    22: 'aut_reg',
    23: 'hors_reg',
    '24T30': 'hors_met',
    _T: 'tot',
  },
  // WSS
  WSS: {
    '1_3': 'sans_eau',
    2: 'ef_ec',
    _T: 'tot',
  },
  // WW
  WW: {
    0: 'sol',
    1: 'reseau',
    2: 'fosse',
    3: 'puisard',
    _T: 'tot',
  },
}

/** Libellés courts pour contextualiser les valeurs génériques (Oui / Non, etc.) */
export const conceptShortLabels: Record<string, string> = {
  AIRCOND: 'Climatisation',
  BAINWC: 'Bain et WC',
  BOARDING_SCHOOL: 'Internat',
  CANTEEN: 'Cantine',
  CARPARK: 'Parking',
  COUPLE: 'Vie en couple',
  CPGE: 'CPGE',
  ELEC: 'Électricité',
  EP: 'Éducation prioritaire',
  FREE_ACCESS: 'Accès libre',
  INDOOR: 'Couvert',
  LIGHTED: 'Éclairé',
  LOCKER_ROOM_ACCESSIBILITY: 'Vestiaire accessible',
  MULTIPLEX_CINEMA: 'Multiplexe',
  PRACTICE_AREA_ACCESSIBILITY: 'Aire de pratique accessible',
  SANITARY: 'Sanitaires',
  SANITARY_ACCESSIBILITY: 'Sanitaires accessibles',
  SEASONAL_OPENING: 'Ouverture saisonnière',
  SHOWER: 'Douches',
  SOBO: 'Chauffe-eau solaire',
  STUD: 'Scolarisé',
}

/** Libellés négatifs explicites pour éviter les formulations "Sans xxx" */
export const conceptNegativeLabels: Record<string, string> = {
  COUPLE: 'Seul',
  LIGHTED: 'Obscur',
  MULTIPLEX_CINEMA: 'Classique',
  STUD: 'Non scolarisé',
}

export function slugifyLabel (label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 30)
}

export function getAbbreviation (
  concept: string,
  code: string,
  label?: string
): string {
  const mapped = labelMapping[concept]?.[code]
  if (mapped !== undefined) return mapped
  if (!label || label === code) return code.toLowerCase()
  return slugifyLabel(label)
}
