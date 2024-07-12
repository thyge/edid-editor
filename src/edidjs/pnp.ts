
const pnpLookup = [
    {
		ID:      "TTL",
		Company: "2-TEL B.V",
		Date:    "03/20/1999",
	},
    {
		ID:      "BUT",
		Company: "21ST CENTURY ENTERTAINMENT",
		Date:    "04/25/2002",
	},
    {
		ID:      "TCM",
		Company: "3COM CORPORATION",
		Date:    "11/29/1996",
	},
    {
		ID:      "TDP",
		Company: "3D PERCEPTION",
		Date:    "05/16/2002",
	},
    {
		ID:      "VSD",
		Company: "3M",
		Date:    "10/16/1998",
	},
	{
		ID:      "NOD",
		Company: "3NOD DIGITAL TECHNOLOGY CO. LTD.",
		Date:    "12/11/2014",
	},
	{
		ID:      "NGS",
		Company: "A D S EXPORTS",
		Date:    "07/16/1998",
	},
	{
		ID:      "API",
		Company: "A PLUS INFO CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "ACG",
		Company: "A&R CAMBRIDGE LTD.",
		Date:    "06/13/2007",
	},
	{
		ID:      "APV",
		Company: "A+V LINK",
		Date:    "01/27/2010",
	},
	{
		ID:      "AVX",
		Company: "A/VAUX ELECTRONICS",
		Date:    "08/29/2012",
	},
	{
		ID:      "AAN",
		Company: "AAEON TECHNOLOGY INC.",
		Date:    "09/01/2016",
	},
	{
		ID:      "TRU",
		Company: "AASHIMA TECHNOLOGY B.V.",
		Date:    "05/08/1998",
	},
	{
		ID:      "AAM",
		Company: "AAVA MOBILE OY",
		Date:    "08/13/2013",
	},
	{
		ID:      "GEH",
		Company: "ABACO SYSTEMS, INC.",
		Date:    "09/03/2010",
	},
	{
		ID:      "ABS",
		Company: "ABACO SYSTEMS, INC.",
		Date:    "04/27/2016",
	},
	{
		ID:      "ABA",
		Company: "ABBAHOME INC.",
		Date:    "11/08/1999",
	},
	{
		ID:      "MEG",
		Company: "ABEAM TECH LTD.",
		Date:    "11/29/1996",
	},
	{
		ID:      "ATC",
		Company: "ABLY-TECH CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "ABC",
		Company: "ABOCOM SYSTEM INC.",
		Date:    "03/28/1997",
	},
	{
		ID:      "WTC",
		Company: "ACC MICROELECTRONICS",
		Date:    "11/29/1996",
	},
	{
		ID:      "AWC",
		Company: "ACCESS WORKS COMM INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "PKA",
		Company: "ACCO UK LTD.",
		Date:    "05/12/2003",
	},
	{
		ID:      "ACC",
		Company: "ACCTON TECHNOLOGY CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "ACU",
		Company: "ACCULOGIC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ASL",
		Company: "ACCUSCENE CORPORATION LTD",
		Date:    "06/13/2007",
	},
	{
		ID:      "ANT",
		Company: "ACE CAD ENTERPRISE COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "CHE",
		Company: "ACER INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ALI",
		Company: "ACER LABS",
		Date:    "11/29/1996",
	},
	{
		ID:      "ANX",
		Company: "ACER NETXUS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ACR",
		Company: "ACER TECHNOLOGIES",
		Date:    "11/29/1996",
	},
	{
		ID:      "ACK",
		Company: "ACKSYS",
		Date:    "11/29/1996",
	},
	{
		ID:      "ADC",
		Company: "ACNHOR DATACOMM",
		Date:    "11/29/1996",
	},
	{
		ID:      "CAL",
		Company: "ACON",
		Date:    "11/29/1996",
	},
	{
		ID:      "ALK",
		Company: "ACROLINK INC",
		Date:    "03/12/1997",
	},
	{
		ID:      "ACM",
		Company: "ACROLOOP MOTION CONTROL SYSTEMS INC",
		Date:    "03/26/1998",
	},
	{
		ID:      "LAB",
		Company: "ACT LABS LTD",
		Date:    "09/02/1997",
	},
	{
		ID:      "ACE",
		Company: "ACTEK ENGINEERING PTY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "AEI",
		Company: "ACTIONTEC ELECTRIC INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ACV",
		Company: "ACTIVCARD S.A",
		Date:    "05/08/1998",
	},
	{
		ID:      "ACB",
		Company: "ACULAB LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "ALM",
		Company: "ACUTEC LTD.",
		Date:    "11/08/1999",
	},
	{
		ID:      "GLE",
		Company: "AD ELECTRONICS",
		Date:    "04/19/2000",
	},
	{
		ID:      "ADM",
		Company: "AD LIB MULTIMEDIA INC",
		Date:    "04/23/1998",
	},
	{
		ID:      "ADP",
		Company: "ADAPTEC INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ADX",
		Company: "ADAX INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "RSH",
		Company: "ADC-CENTRE",
		Date:    "11/08/1999",
	},
	{
		ID:      "AVE",
		Company: "ADD VALUE ENTERPISES (ASIA) PTE LTD",
		Date:    "01/10/1999",
	},
	{
		ID:      "ADZ",
		Company: "ADDER TECHNOLOGY LTD",
		Date:    "03/30/2016",
	},
	{
		ID:      "ADA",
		Company: "ADDI-DATA GMBH",
		Date:    "11/29/1996",
	},
	{
		ID:      "ADI",
		Company: "ADI SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "DPM",
		Company: "ADPM SYNTHESIS SAS",
		Date:    "08/10/2000",
	},
	{
		ID:      "AXB",
		Company: "ADRIENNE ELECTRONICS CORPORATION",
		Date:    "10/07/1997",
	},
	{
		ID:      "ADT",
		Company: "ADTEK",
		Date:    "11/29/1996",
	},
	{
		ID:      "ADK",
		Company: "ADTEK SYSTEM SCIENCE COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "FLE",
		Company: "ADTI MEDIA, INC",
		Date:    "09/15/2009",
	},
	{
		ID:      "AND",
		Company: "ADTRAN INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "AGM",
		Company: "ADVAN INT'L CORPORATION",
		Date:    "05/26/1998",
	},
	{
		ID:      "AVN",
		Company: "ADVANCE COMPUTER CORPORATION",
		Date:    "06/10/2010",
	},
	{
		ID:      "MSM",
		Company: "ADVANCED DIGITAL SYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "AED",
		Company: "ADVANCED ELECTRONIC DESIGNS, INC.",
		Date:    "07/12/2004",
	},
	{
		ID:      "RJS",
		Company: "ADVANCED ENGINEERING",
		Date:    "06/25/1998",
	},
	{
		ID:      "GRV",
		Company: "ADVANCED GRAVIS",
		Date:    "11/29/1996",
	},
	{
		ID:      "AIR",
		Company: "ADVANCED INTEG. RESEARCH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ALR",
		Company: "ADVANCED LOGIC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ADV",
		Company: "ADVANCED MICRO DEVICES INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "EVE",
		Company: "ADVANCED MICRO PERIPHERALS LTD",
		Date:    "11/18/2011",
	},
	{
		ID:      "AOE",
		Company: "ADVANCED OPTICS ELECTRONICS, INC.",
		Date:    "04/20/2004",
	},
	{
		ID:      "ADD",
		Company: "ADVANCED PERIPHERAL DEVICES INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ABV",
		Company: "ADVANCED RESEARCH TECHNOLOGY",
		Date:    "01/16/1997",
	},
	{
		ID:      "PSA",
		Company: "ADVANCED SIGNAL PROCESSING TECHNOLOGIES",
		Date:    "09/13/1999",
	},
	{
		ID:      "AHC",
		Company: "ADVANTECH CO., LTD.",
		Date:    "06/13/2007",
	},
	{
		ID:      "ADH",
		Company: "AERODATA HOLDINGS LTD",
		Date:    "11/11/1997",
	},
	{
		ID:      "AEP",
		Company: "AETAS PERIPHERAL INTERNATIONAL",
		Date:    "11/08/1999",
	},
	{
		ID:      "AET",
		Company: "AETHRA TELECOMUNICAZIONI S.R.L.",
		Date:    "12/13/1996",
	},
	{
		ID:      "CHS",
		Company: "AGENTUR CHAIROS",
		Date:    "03/15/2001",
	},
	{
		ID:      "AGT",
		Company: "AGILENT TECHNOLOGIES",
		Date:    "10/08/2001",
	},
	{
		ID:      "ASI",
		Company: "AHEAD SYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "AIM",
		Company: "AIMS LAB INC",
		Date:    "03/13/1998",
	},
	{
		ID:      "AYR",
		Company: "AIRLIB, INC",
		Date:    "02/21/2000",
	},
	{
		ID:      "AWL",
		Company: "AIRONET WIRELESS COMMUNICATIONS, INC",
		Date:    "08/11/1998",
	},
	{
		ID:      "AIW",
		Company: "AIWA COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "AJA",
		Company: "AJA VIDEO SYSTEMS, INC.",
		Date:    "10/11/2007",
	},
	{
		ID:      "AKE",
		Company: "AKAMI ELECTRIC CO.,LTD",
		Date:    "09/03/2010",
	},
	{
		ID:      "AKB",
		Company: "AKEBIA LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "AKI",
		Company: "AKIA CORPORATION",
		Date:    "12/23/1998",
	},
	{
		ID:      "ALH",
		Company: "AL SYSTEMS",
		Date:    "01/20/1999",
	},
	{
		ID:      "ALA",
		Company: "ALACRON INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ALN",
		Company: "ALANA TECHNOLOGIES",
		Date:    "01/13/2000",
	},
	{
		ID:      "AOT",
		Company: "ALCATEL",
		Date:    "11/06/2001",
	},
	{
		ID:      "ABE",
		Company: "ALCATEL BELL",
		Date:    "11/29/1996",
	},
	{
		ID:      "ADB",
		Company: "ALDEBBARON",
		Date:    "03/15/2001",
	},
	{
		ID:      "ALE",
		Company: "ALENCO BV",
		Date:    "05/20/2014",
	},
	{
		ID:      "ALX",
		Company: "ALEXON CO.,LTD.",
		Date:    "09/13/1999",
	},
	{
		ID:      "AFA",
		Company: "ALFA INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ALO",
		Company: "ALGOLITH INC.",
		Date:    "05/02/2005",
	},
	{
		ID:      "AGO",
		Company: "ALGOLTEK, INC.",
		Date:    "10/23/2013",
	},
	{
		ID:      "AIS",
		Company: "ALIEN INTERNET SERVICES",
		Date:    "06/21/2001",
	},
	{
		ID:      "ABD",
		Company: "ALLEN BRADLEY COMPANY",
		Date:    "11/29/1996",
	},
	{
		ID:      "ALL",
		Company: "ALLIANCE SEMICONDUCTOR CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "ATI",
		Company: "ALLIED TELESIS KK",
		Date:    "11/29/1996",
	},
	{
		ID:      "ATK",
		Company: "ALLIED TELESYN INT'L",
		Date:    "11/29/1996",
	},
	{
		ID:      "ATA",
		Company: "ALLIED TELESYN INTERNATIONAL (ASIA) PTE LTD",
		Date:    "11/10/1997",
	},
	{
		ID:      "ACO",
		Company: "ALLION COMPUTER INC.",
		Date:    "10/23/2000",
	},
	{
		ID:      "XAD",
		Company: "ALPHA DATA",
		Date:    "10/08/2009",
	},
	{
		ID:      "AEJ",
		Company: "ALPHA ELECTRONICS COMPANY",
		Date:    "11/29/1996",
	},
	{
		ID:      "ATD",
		Company: "ALPHA TELECOM INC",
		Date:    "09/26/1997",
	},
	{
		ID:      "ATP",
		Company: "ALPHA-TOP CORPORATION",
		Date:    "12/04/1996",
	},
	{
		ID:      "ALV",
		Company: "ALPHAVIEW LCD",
		Date:    "11/01/2008",
	},
	{
		ID:      "APE",
		Company: "ALPINE ELECTRONICS, INC.",
		Date:    "01/22/2013",
	},
	{
		ID:      "ALP",
		Company: "ALPS ELECTRIC COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "AUI",
		Company: "ALPS ELECTRIC INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ARC",
		Company: "ALTA RESEARCH CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "ALC",
		Company: "ALTEC CORPORATION",
		Date:    "08/04/1998",
	},
	{
		ID:      "ALJ",
		Company: "ALTEC LANSING",
		Date:    "01/13/2000",
	},
	{
		ID:      "AIX",
		Company: "ALTINEX, INC.",
		Date:    "04/24/2001",
	},
	{
		ID:      "AIE",
		Company: "ALTMANN INDUSTRIEELEKTRONIK",
		Date:    "11/29/1996",
	},
	{
		ID:      "ACS",
		Company: "ALTOS COMPUTER SYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "AIL",
		Company: "ALTOS INDIA LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "ALT",
		Company: "ALTRA",
		Date:    "11/29/1996",
	},
	{
		ID:      "CNC",
		Company: "ALVEDON COMPUTERS LTD",
		Date:    "11/06/1998",
	},
	{
		ID:      "AMB",
		Company: "AMBIENT TECHNOLOGIES, INC.",
		Date:    "05/16/1999",
	},
	{
		ID:      "AMD",
		Company: "AMDEK CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "AOL",
		Company: "AMERICA ONLINE",
		Date:    "11/29/1996",
	},
	{
		ID:      "YOW",
		Company: "AMERICAN BIOMETRIC COMPANY",
		Date:    "05/16/1999",
	},
	{
		ID:      "AXP",
		Company: "AMERICAN EXPRESS",
		Date:    "07/16/1999",
	},
	{
		ID:      "AXI",
		Company: "AMERICAN MAGNETICS",
		Date:    "03/15/2001",
	},
	{
		ID:      "AMI",
		Company: "AMERICAN MEGATRENDS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "MCA",
		Company: "AMERICAN NUCLEAR SYSTEMS INC",
		Date:    "02/12/1997",
	},
	{
		ID:      "CNB",
		Company: "AMERICAN POWER CONVERSION",
		Date:    "03/15/2001",
	},
	{
		ID:      "APC",
		Company: "AMERICAN POWER CONVERSION",
		Date:    "11/29/1996",
	},
	{
		ID:      "AMN",
		Company: "AMIMON LTD.",
		Date:    "06/13/2007",
	},
	{
		ID:      "AMO",
		Company: "AMINO TECHNOLOGIES PLC AND AMINO COMMUNICATIONS LIMITED",
		Date:    "12/09/2011",
	},
	{
		ID:      "AKL",
		Company: "AMIT LTD",
		Date:    "12/02/1997",
	},
	{
		ID:      "AMP",
		Company: "AMP INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "AII",
		Company: "AMPTRON INTERNATIONAL INC.",
		Date:    "05/24/2000",
	},
	{
		ID:      "AMT",
		Company: "AMT INTERNATIONAL INDUSTRY",
		Date:    "11/29/1996",
	},
	{
		ID:      "AMR",
		Company: "AMTRAN TECHNOLOGY CO., LTD.",
		Date:    "06/10/2013",
	},
	{
		ID:      "AMX",
		Company: "AMX LLC",
		Date:    "07/06/2008",
	},
	{
		ID:      "BBB",
		Company: "AN-NAJAH UNIVERSITY",
		Date:    "03/15/2001",
	},
	{
		ID:      "ANA",
		Company: "ANAKRON",
		Date:    "11/08/1999",
	},
	{
		ID:      "ADN",
		Company: "ANALOG & DIGITAL DEVICES TEL. INC",
		Date:    "03/14/1997",
	},
	{
		ID:      "ADS",
		Company: "ANALOG DEVICES INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ANW",
		Company: "ANALOG WAY SAS",
		Date:    "01/22/2014",
	},
	{
		ID:      "ANL",
		Company: "ANALOGIX SEMICONDUCTOR, INC",
		Date:    "10/10/2005",
	},
	{
		ID:      "AAE",
		Company: "ANATEK ELECTRONICS INC.",
		Date:    "05/25/2004",
	},
	{
		ID:      "ABT",
		Company: "ANCHOR BAY TECHNOLOGIES, INC.",
		Date:    "02/14/2006",
	},
	{
		ID:      "ACI",
		Company: "ANCOR COMMUNICATIONS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ANC",
		Company: "ANCOT",
		Date:    "11/29/1996",
	},
	{
		ID:      "AML",
		Company: "ANDERSON MULTIMEDIA COMMUNICATIONS (HK) LIMITED",
		Date:    "01/03/2003",
	},
	{
		ID:      "ANP",
		Company: "ANDREW NETWORK PRODUCTION",
		Date:    "11/29/1996",
	},
	{
		ID:      "ANI",
		Company: "ANIGMA INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ANK",
		Company: "ANKO ELECTRONIC COMPANY LTD",
		Date:    "03/24/1998",
	},
	{
		ID:      "AAT",
		Company: "ANN ARBOR TECHNOLOGIES",
		Date:    "04/24/2001",
	},
	{
		ID:      "ANO",
		Company: "ANORAD CORPORATION",
		Date:    "01/13/2000",
	},
	{
		ID:      "ANR",
		Company: "ANR LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "ANS",
		Company: "ANSEL COMMUNICATION COMPANY",
		Date:    "11/29/1996",
	},
	{
		ID:      "AEC",
		Company: "ANTEX ELECTRONICS CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "AOA",
		Company: "AOPEN INC.",
		Date:    "11/06/2001",
	},
	{
		ID:      "APX",
		Company: "AP DESIGNS LTD",
		Date:    "12/08/1997",
	},
	{
		ID:      "DNG",
		Company: "APACHE MICRO PERIPHERALS INC",
		Date:    "11/11/1997",
	},
	{
		ID:      "APL",
		Company: "APLICOM OY",
		Date:    "05/02/2005",
	},
	{
		ID:      "APN",
		Company: "APPIAN TECH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "APP",
		Company: "APPLE COMPUTER INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "APD",
		Company: "APPLIADATA",
		Date:    "11/29/1996",
	},
	{
		ID:      "ACT",
		Company: "APPLIED CREATIVE TECHNOLOGY",
		Date:    "11/29/1996",
	},
	{
		ID:      "APM",
		Company: "APPLIED MEMORY TECH",
		Date:    "11/29/1996",
	},
	{
		ID:      "ACL",
		Company: "APRICOT COMPUTERS",
		Date:    "11/29/1996",
	},
	{
		ID:      "APR",
		Company: "APRILIA S.P.A.",
		Date:    "02/22/1999",
	},
	{
		ID:      "ATJ",
		Company: "ARCHITEK CORPORATION",
		Date:    "01/22/2014",
	},
	{
		ID:      "ACH",
		Company: "ARCHTEK TELECOM CORPORATION",
		Date:    "01/15/1997",
	},
	{
		ID:      "ATL",
		Company: "ARCUS TECHNOLOGY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "ARD",
		Company: "AREC INC.",
		Date:    "07/08/2013",
	},
	{
		ID:      "ARS",
		Company: "ARESCOM INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "AGL",
		Company: "ARGOLIS",
		Date:    "03/15/2001",
	},
	{
		ID:      "ARI",
		Company: "ARGOSY RESEARCH INC",
		Date:    "02/24/1997",
	},
	{
		ID:      "ARG",
		Company: "ARGUS ELECTRONICS CO., LTD",
		Date:    "06/04/2004",
	},
	{
		ID:      "ACA",
		Company: "ARIEL CORPORATION",
		Date:    "12/13/1996",
	},
	{
		ID:      "ARM",
		Company: "ARIMA",
		Date:    "04/07/2004",
	},
	{
		ID:      "ADE",
		Company: "ARITHMOS, INC.",
		Date:    "07/16/1999",
	},
	{
		ID:      "ARK",
		Company: "ARK LOGIC INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ARL",
		Company: "ARLOTTO COMNET INC",
		Date:    "04/29/1997",
	},
	{
		ID:      "AMS ",
		Company: "ARMSTEL, INC.",
		Date:    "02/25/2011",
	},
	{
		ID:      "AIC",
		Company: "ARNOS INSTURMENTS & COMPUTER SYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "ARR",
		Company: "ARRIS GROUP, INC.",
		Date:    "01/27/2015",
	},
	{
		ID:      "IMB",
		Company: "ART S.R.L.",
		Date:    "01/27/2012",
	},
	{
		ID:      "AGI",
		Company: "ARTISH GRAPHICS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "NPA",
		Company: "ARVANICS",
		Date:    "03/05/2015",
	},
	{
		ID:      "AKM",
		Company: "ASAHI KASEI MICROSYSTEMS COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "ASN",
		Company: "ASANTE TECH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "HER",
		Company: "ASCOM BUSINESS SYSTEMS",
		Date:    "01/20/1999",
	},
	{
		ID:      "ASC",
		Company: "ASCOM STRATEGIC TECHNOLOGY UNIT",
		Date:    "11/29/1996",
	},
	{
		ID:      "ASM",
		Company: "ASEM S.P.A.",
		Date:    "03/15/2001",
	},
	{
		ID:      "AEM",
		Company: "ASEM S.P.A.",
		Date:    "11/29/1996",
	},
	{
		ID:      "ASE",
		Company: "ASEV DISPLAY LABS",
		Date:    "10/16/1998",
	},
	{
		ID:      "ASH",
		Company: "ASHTON BENTLEY CONCEPTS",
		Date:    "09/20/2013",
	},
	{
		ID:      "AMA",
		Company: "ASIA MICROELECTRONIC DEVELOPMENT INC",
		Date:    "09/24/1997",
	},
	{
		ID:      "ASK",
		Company: "ASK A/S",
		Date:    "11/29/1996",
	},
	{
		ID:      "DYN",
		Company: "ASKEY COMPUTER CORPORATION",
		Date:    "07/22/1997",
	},
	{
		ID:      "AKY",
		Company: "ASKEY COMPUTER CORPORATION",
		Date:    "04/02/1997",
	},
	{
		ID:      "ASP",
		Company: "ASP MICROELECTRONICS LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "ACP",
		Company: "ASPEN TECH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "AST",
		Company: "AST RESEARCH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "JAC",
		Company: "ASTEC INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ADL",
		Company: "ASTRA SECURITY PRODUCTS LTD",
		Date:    "07/30/1997",
	},
	{
		ID:      "ATO",
		Company: "ASTRO DESIGN, INC.",
		Date:    "06/06/2003",
	},
	{
		ID:      "AHQ",
		Company: "ASTRO HQ LLC",
		Date:    "09/05/2018",
	},
	{
		ID:      "ASU",
		Company: "ASUSCOM NETWORK INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "AUS",
		Company: "ASUSTEK COMPUTER INC",
		Date:    "12/21/2015",
	},
	{
		ID:      "ATT",
		Company: "AT&T",
		Date:    "11/29/1996",
	},
	{
		ID:      "GIS",
		Company: "AT&T GLOBAL INFO SOLUTIONS",
		Date:    "11/29/1996",
	},
	{
		ID:      "HSM",
		Company: "AT&T MICROELECTRONICS",
		Date:    "11/29/1996",
	},
	{
		ID:      "TME",
		Company: "AT&T MICROELECTRONICS",
		Date:    "11/29/1996",
	},
	{
		ID:      "PDN",
		Company: "AT&T PARADYNE",
		Date:    "11/29/1996",
	},
	{
		ID:      "AVJ",
		Company: "ATELIER VISION CORPORATION",
		Date:    "02/24/2015",
	},
	{
		ID:      "ATH",
		Company: "ATHENA INFORMATICA S.R.L.",
		Date:    "01/29/1997",
	},
	{
		ID:      "ATN",
		Company: "ATHENA SMARTCARD SOLUTIONS LTD.",
		Date:    "09/13/1999",
	},
	{
		ID:      "ATX",
		Company: "ATHENIX CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "BUJ",
		Company: "ATI TECH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "CFG",
		Company: "ATLANTIS",
		Date:    "11/29/1996",
	},
	{
		ID:      "ATM",
		Company: "ATM LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "AKP",
		Company: "ATOM KOMPLEX PRYLAD",
		Date:    "10/23/2000",
	},
	{
		ID:      "AMC",
		Company: "ATTACHMATE CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "FWA",
		Company: "ATTERO TECH, LLC",
		Date:    "04/20/2010",
	},
	{
		ID:      "APT",
		Company: "AUDIO PROCESSING TECHNOLOGY LTD",
		Date:    "03/18/1997",
	},
	{
		ID:      "ASX",
		Company: "AUDIOSCIENCE",
		Date:    "11/29/1996",
	},
	{
		ID:      "AUG",
		Company: "AUGUST HOME, INC.",
		Date:    "06/11/2014",
	},
	{
		ID:      "AVC",
		Company: "AURAVISION CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "AUR",
		Company: "AUREAL SEMICONDUCTOR",
		Date:    "11/29/1996",
	},
	{
		ID:      "APS",
		Company: "AUTOLOGIC INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "CLT",
		Company: "AUTOMATED COMPUTER CONTROL SYSTEMS",
		Date:    "09/13/1999",
	},
	{
		ID:      "AUT",
		Company: "AUTOTIME CORPORATION",
		Date:    "10/08/2001",
	},
	{
		ID:      "AUV",
		Company: "AUVIDEA GMBH",
		Date:    "04/21/2014",
	},
	{
		ID:      "AVL",
		Company: "AVALUE TECHNOLOGY INC.",
		Date:    "11/18/2011",
	},
	{
		ID:      "ALS",
		Company: "AVANCE LOGIC INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "AVS",
		Company: "AVATRON SOFTWARE INC.",
		Date:    "08/23/2017",
	},
	{
		ID:      "AVA",
		Company: "AVAYA COMMUNICATION",
		Date:    "03/15/2001",
	},
	{
		ID:      "AVG",
		Company: "AVEGANT CORPORATION",
		Date:    "12/02/2015",
	},
	{
		ID:      "AEN",
		Company: "AVENCALL",
		Date:    "01/27/2012",
	},
	{
		ID:      "AVR",
		Company: "AVER INFORMATION INC.",
		Date:    "05/07/2010",
	},
	{
		ID:      "AVD",
		Company: "AVID ELECTRONICS CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "AVM",
		Company: "AVM GMBH",
		Date:    "11/29/1996",
	},
	{
		ID:      "AVO",
		Company: "AVOCENT CORPORATION",
		Date:    "10/23/2000",
	},
	{
		ID:      "AAA",
		Company: "AVOLITES LTD",
		Date:    "02/17/2012",
	},
	{
		ID:      "AVT",
		Company: "AVTEK (ELECTRONICS) PTY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "ACD",
		Company: "AWETA BV",
		Date:    "01/20/1998",
	},
	{
		ID:      "AXL",
		Company: "AXEL",
		Date:    "11/29/1996",
	},
	{
		ID:      "AXE",
		Company: "AXELL CORPORATION",
		Date:    "08/03/2016",
	},
	{
		ID:      "AXC",
		Company: "AXIOMTEK CO., LTD.",
		Date:    "05/02/2005",
	},
	{
		ID:      "AXO",
		Company: "AXONIC LABS LLC",
		Date:    "06/21/2012",
	},
	{
		ID:      "AXT",
		Company: "AXTEND TECHNOLOGIES INC",
		Date:    "12/01/1997",
	},
	{
		ID:      "AXX",
		Company: "AXXON COMPUTER CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "AXY",
		Company: "AXYZ AUTOMATION SERVICES, INC",
		Date:    "08/11/1998",
	},
	{
		ID:      "AYD",
		Company: "AYDIN DISPLAYS",
		Date:    "06/13/2007",
	},
	{
		ID:      "AZM",
		Company: "AZ MIDDELHEIM - RADIOTHERAPY",
		Date:    "11/14/2003",
	},
	{
		ID:      "AZT",
		Company: "AZTECH SYSTEMS LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "BBH",
		Company: "B&BH",
		Date:    "01/17/2003",
	},
	{
		ID:      "SMR",
		Company: "B.& V. S.R.L.",
		Date:    "03/21/1997",
	},
	{
		ID:      "BFE",
		Company: "B.F. ENGINEERING CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "BUG",
		Company: "B.U.G., INC.",
		Date:    "08/30/2011",
	},
	{
		ID:      "BNO",
		Company: "BANG & OLUFSEN",
		Date:    "05/16/2003",
	},
	{
		ID:      "BNK",
		Company: "BANKSIA TECH PTY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "BAN",
		Company: "BANYAN",
		Date:    "11/29/1996",
	},
	{
		ID:      "BRC",
		Company: "BARC",
		Date:    "08/10/2000",
	},
	{
		ID:      "BDS",
		Company: "BARCO DISPLAY SYSTEMS",
		Date:    "09/13/1999",
	},
	{
		ID:      "BCD",
		Company: "BARCO GMBH",
		Date:    "03/07/2011",
	},
	{
		ID:      "BGB",
		Company: "BARCO GRAPHICS N.V",
		Date:    "11/29/1996",
	},
	{
		ID:      "BPS",
		Company: "BARCO, N.V.",
		Date:    "09/12/2000",
	},
	{
		ID:      "DDS",
		Company: "BARCO, N.V.",
		Date:    "10/23/2000",
	},
	{
		ID:      "BEO",
		Company: "BAUG & OLUFSEN",
		Date:    "11/29/1996",
	},
	{
		ID:      "BCC",
		Company: "BEAVER COMPUTER CORPORATON",
		Date:    "11/29/1996",
	},
	{
		ID:      "BEC",
		Company: "BECKHOFF AUTOMATION",
		Date:    "04/25/2002",
	},
	{
		ID:      "BEI",
		Company: "BECKWORTH ENTERPRISES INC",
		Date:    "07/16/1997",
	},
	{
		ID:      "LHC",
		Company: "BEIHAI CENTURY JOINT INNOVATION TECHNOLOGY CO.,LTD",
		Date:    "09/10/2019",
	},
	{
		ID:      "AGC",
		Company: "BEIJING AEROSPACE GOLDEN CARD ELECTRONIC ENGINEERING CO.,LTD.",
		Date:    "06/21/2001",
	},
	{
		ID:      "AHS",
		Company: "BEIJING ANHENG SECOTECH INFORMATION TECHNOLOGY CO., LTD.",
		Date:    "03/24/2015",
	},
	{
		ID:      "ANV",
		Company: "BEIJING ANTVR TECHNOLOGY CO., LTD.",
		Date:    "08/24/2015",
	},
	{
		ID:      "NRT",
		Company: "BEIJING NORTHERN RADIANTELECOM CO.",
		Date:    "03/20/1999",
	},
	{
		ID:      "BEK",
		Company: "BEKO ELEKTRONIK A.S.",
		Date:    "06/15/2005",
	},
	{
		ID:      "BEL",
		Company: "BELTRONIC INDUSTRIEELEKTRONIK GMBH",
		Date:    "09/05/2006",
	},
	{
		ID:      "BMI",
		Company: "BENSON MEDICAL INSTRUMENTS COMPANY",
		Date:    "12/04/1996",
	},
	{
		ID:      "BUR",
		Company: "BERNECKER & RAINER IND-ELETRONIK GMBH",
		Date:    "11/29/1996",
	},
	{
		ID:      "INZ",
		Company: "BEST BUY",
		Date:    "06/04/2004",
	},
	{
		ID:      "VPR",
		Company: "BEST BUY",
		Date:    "05/16/2002",
	},
	{
		ID:      "BPU",
		Company: "BEST POWER",
		Date:    "11/29/1996",
	},
	{
		ID:      "BIA",
		Company: "BIAMP SYSTEMS CORPORATION",
		Date:    "05/14/2015",
	},
	{
		ID:      "ICC",
		Company: "BICC DATA NETWORKS LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "BIC",
		Company: "BIG ISLAND COMMUNICATIONS",
		Date:    "05/13/1997",
	},
	{
		ID:      "BLD",
		Company: "BILD INNOVATIVE TECHNOLOGY LLC",
		Date:    "10/22/2019",
	},
	{
		ID:      "BIL",
		Company: "BILLION ELECTRIC COMPANY LTD",
		Date:    "12/11/1996",
	},
	{
		ID:      "BLN",
		Company: "BIOLINK TECHNOLOGIES",
		Date:    "08/10/2000",
	},
	{
		ID:      "BIO",
		Company: "BIOLINK TECHNOLOGIES INTERNATIONAL, INC.",
		Date:    "05/24/2000",
	},
	{
		ID:      "BML",
		Company: "BIOMED LAB",
		Date:    "05/22/1997",
	},
	{
		ID:      "BSL",
		Company: "BIOMEDICAL SYSTEMS LABORATORY",
		Date:    "10/16/1997",
	},
	{
		ID:      "BMS",
		Company: "BIOMEDISYS",
		Date:    "05/24/2000",
	},
	{
		ID:      "BAC",
		Company: "BIOMETRIC ACCESS CORPORATION",
		Date:    "05/19/1998",
	},
	{
		ID:      "BTO",
		Company: "BIOTAO LTD",
		Date:    "03/21/2012",
	},
	{
		ID:      "BIT",
		Company: "BIT 3 COMPUTER",
		Date:    "11/29/1996",
	},
	{
		ID:      "BTC",
		Company: "BIT 3 COMPUTER",
		Date:    "11/29/1996",
	},
	{
		ID:      "BTF",
		Company: "BITFIELD OY",
		Date:    "11/29/1996",
	},
	{
		ID:      "BHZ",
		Company: "BITHEADZ, INC.",
		Date:    "09/29/2003",
	},
	{
		ID:      "BWK",
		Company: "BITWORKS INC.",
		Date:    "07/10/2003",
	},
	{
		ID:      "BBX",
		Company: "BLACK BOX CORPORATION",
		Date:    "02/28/2017",
	},
	{
		ID:      "BMD",
		Company: "BLACKMAGIC DESIGN",
		Date:    "09/13/2012",
	},
	{
		ID:      "BDR",
		Company: "BLONDER TONGUE LABS, INC.",
		Date:    "09/16/2008",
	},
	{
		ID:      "BLP",
		Company: "BLOOMBERG L.P.",
		Date:    "09/16/2008",
	},
	{
		ID:      "BBV",
		Company: "BLUEBOX VIDEO LIMITED",
		Date:    "06/22/2017",
	},
	{
		ID:      "ZZZ",
		Company: "BOCA RESEARCH INC",
		Date:    "02/13/1997",
	},
	{
		ID:      "BRI",
		Company: "BOCA RESEARCH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "BST",
		Company: "BODYSOUND TECHNOLOGIES, INC.",
		Date:    "03/12/2008",
	},
	{
		ID:      "BOE",
		Company: "BOE",
		Date:    "12/02/2004",
	},
	{
		ID:      "BII",
		Company: "BOECKELER INSTRUMENTS INC",
		Date:    "10/17/1996",
	},
	{
		ID:      "BCS",
		Company: "BOORIA CAD/CAM SYSTEMS",
		Date:    "05/11/2005",
	},
	{
		ID:      "BOS",
		Company: "BOS",
		Date:    "07/03/1997",
	},
	{
		ID:      "BSE",
		Company: "BOSE CORPORATION",
		Date:    "09/05/2006",
	},
	{
		ID:      "BNS",
		Company: "BOULDER NONLINEAR SYSTEMS",
		Date:    "03/12/2008",
	},
	{
		ID:      "BRA",
		Company: "BRAEMAC PTY LTD",
		Date:    "11/18/2010",
	},
	{
		ID:      "BRM",
		Company: "BRAEMAR INC",
		Date:    "10/07/1997",
	},
	{
		ID:      "BDO",
		Company: "BRAHLER ICS",
		Date:    "06/04/1998",
	},
	{
		ID:      "BBL",
		Company: "BRAIN BOXES LIMITED",
		Date:    "10/02/2001",
	},
	{
		ID:      "BRG",
		Company: "BRIDGE INFORMATION CO., LTD",
		Date:    "08/11/1998",
	},
	{
		ID:      "BSN",
		Company: "BRIGHTSIGN, LLC",
		Date:    "02/28/2012",
	},
	{
		ID:      "BTE",
		Company: "BRILLIANT TECHNOLOGY",
		Date:    "11/29/1996",
	},
	{
		ID:      "BCI",
		Company: "BROADATA COMMUNICATIONS INC.",
		Date:    "11/19/2013",
	},
	{
		ID:      "BCM",
		Company: "BROADCOM",
		Date:    "04/01/2004",
	},
	{
		ID:      "BRO",
		Company: "BROTHER INDUSTRIES,LTD.",
		Date:    "02/21/2000",
	},
	{
		ID:      "NFC",
		Company: "BTC KOREA CO., LTD",
		Date:    "02/25/2002",
	},
	{
		ID:      "BGT",
		Company: "BUDZETRON INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "BUL",
		Company: "BULL",
		Date:    "02/03/1998",
	},
	{
		ID:      "BNE",
		Company: "BULL AB",
		Date:    "10/06/1998",
	},
	{
		ID:      "BLI",
		Company: "BUSICOM",
		Date:    "08/11/1998",
	},
	{
		ID:      "BTI",
		Company: "BUSTECH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "BUS",
		Company: "BUSTEK",
		Date:    "11/29/1996",
	},
	{
		ID:      "FLY",
		Company: "BUTTERFLY COMMUNICATIONS",
		Date:    "05/05/1997",
	},
	{
		ID:      "BXE",
		Company: "BUXCO ELECTRONICS",
		Date:    "11/29/1996",
	},
	{
		ID:      "BYD",
		Company: "BYD:SIGN CORPORATION",
		Date:    "04/10/2008",
	},
	{
		ID:      "FVX",
		Company: "C-C-C GROUP PLC",
		Date:    "05/04/1998",
	},
	{
		ID:      "CCC",
		Company: "C-CUBE MICROSYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "CEP",
		Company: "C-DAC",
		Date:    "11/29/1996",
	},
	{
		ID:      "CMI",
		Company: "C-MEDIA ELECTRONICS",
		Date:    "11/29/1996",
	},
	{
		ID:      "XMM",
		Company: "C3PO S.L.",
		Date:    "03/03/1998",
	},
	{
		ID:      "CAC",
		Company: "CA & F ELETTRONICA",
		Date:    "05/16/1999",
	},
	{
		ID:      "CBT",
		Company: "CABLETIME LTD",
		Date:    "05/04/2010",
	},
	{
		ID:      "CSI",
		Company: "CABLETRON SYSTEM INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "CCI",
		Company: "CACHE",
		Date:    "11/29/1996",
	},
	{
		ID:      "CAG",
		Company: "CALCOMP",
		Date:    "11/29/1996",
	},
	{
		ID:      "CDP",
		Company: "CALCOMP",
		Date:    "11/29/1996",
	},
	{
		ID:      "CUK",
		Company: "CALIBRE UK LTD",
		Date:    "09/15/2005",
	},
	{
		ID:      "CSO",
		Company: "CALIFORNIA INSTITUTE OF TECHNOLOGY",
		Date:    "03/20/1999",
	},
	{
		ID:      "CAM",
		Company: "CAMBRIDGE AUDIO",
		Date:    "08/09/2008",
	},
	{
		ID:      "CED",
		Company: "CAMBRIDGE ELECTRONIC DESIGN LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "CMR",
		Company: "CAMBRIDGE RESEARCH SYSTEMS LTD",
		Date:    "04/25/2002",
	},
	{
		ID:      "CRW",
		Company: "CAMMEGH LIMITED",
		Date:    "06/18/2019",
	},
	{
		ID:      "CNN",
		Company: "CANON INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "CAI",
		Company: "CANON INC.",
		Date:    "11/06/2001",
	},
	{
		ID:      "UBU",
		Company: "CANONICAL LTD.",
		Date:    "05/24/2013",
	},
	{
		ID:      "CAN",
		Company: "CANOPUS COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "CPM",
		Company: "CAPELLA MICROSYSTEMS INC.",
		Date:    "05/09/2012",
	},
	{
		ID:      "CCP",
		Company: "CAPETRONIC USA INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "DJE",
		Company: "CAPSTONE VISUA LPRODUCT DEVELOPMENT",
		Date:    "10/09/2008",
	},
	{
		ID:      "CAR",
		Company: "CARDINAL COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "CRD",
		Company: "CARDINAL TECHNICAL INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "CLX",
		Company: "CARDLOGIX",
		Date:    "03/15/2001",
	},
	{
		ID:      "CKJ",
		Company: "CARINA SYSTEM CO., LTD.",
		Date:    "09/03/2010",
	},
	{
		ID:      "CZE",
		Company: "CARL ZEISS AG",
		Date:    "06/03/2009",
	},
	{
		ID:      "JAZ",
		Company: "CARRERA COMPUTER INC",
		Date:    "01/01/1994",
	},
	{
		ID:      "CAS",
		Company: "CASIO COMPUTER CO.,LTD",
		Date:    "10/06/1998",
	},
	{
		ID:      "CAA",
		Company: "CASTLES AUTOMATION CO., LTD",
		Date:    "01/13/2000",
	},
	{
		ID:      "CAV",
		Company: "CAVIUM NETWORKS, INC",
		Date:    "02/02/2011",
	},
	{
		ID:      "CCL",
		Company: "CCL/ITRI",
		Date:    "03/31/1997",
	},
	{
		ID:      "CBR",
		Company: "CEBRA TECH A/S",
		Date:    "11/29/1996",
	},
	{
		ID:      "CEF",
		Company: "CEFAR DIGITAL VISION",
		Date:    "02/19/1997",
	},
	{
		ID:      "CEN",
		Company: "CENTURION TECHNOLOGIES P/L",
		Date:    "10/23/2000",
	},
	{
		ID:      "TCE",
		Company: "CENTURY CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "CRV",
		Company: "CEREVO INC.",
		Date:    "07/13/2010",
	},
	{
		ID:      "CER",
		Company: "CERONIX",
		Date:    "09/02/2008",
	},
	{
		ID:      "TOM",
		Company: "CETON CORPORATION",
		Date:    "05/08/2014",
	},
	{
		ID:      "CHP",
		Company: "CH PRODUCTS",
		Date:    "04/24/1997",
	},
	{
		ID:      "CHD",
		Company: "CHANGHONG ELECTRIC CO.,LTD",
		Date:    "11/30/2001",
	},
	{
		ID:      "FIR",
		Company: "CHAPLET SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "CHA",
		Company: "CHASE RESEARCH PLC",
		Date:    "11/29/1996",
	},
	{
		ID:      "CMG",
		Company: "CHENMING MOLD IND. CORP.",
		Date:    "11/14/2003",
	},
	{
		ID:      "CHY",
		Company: "CHERRY GMBH",
		Date:    "05/16/1999",
	},
	{
		ID:      "CMO",
		Company: "CHI MEI OPTOELECTRONICS CORP.",
		Date:    "03/15/2001",
	},
	{
		ID:      "CHM",
		Company: "CHIC TECHNOLOGY CORP.",
		Date:    "07/16/1999",
	},
	{
		ID:      "CEC",
		Company: "CHICONY ELECTRONICS COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "CMN",
		Company: "CHIMEI INNOLUX CORPORATION",
		Date:    "09/02/2010",
	},
	{
		ID:      "HLG",
		Company: "CHINA HUALU GROUP CO., LTD.",
		Date:    "05/13/2013",
	},
	{
		ID:      "CHL",
		Company: "CHLORIDE-R&D",
		Date:    "11/29/1996",
	},
	{
		ID:      "CDG",
		Company: "CHRISTIE DIGITAL SYSTEMS INC",
		Date:    "04/24/2001",
	},
	{
		ID:      "CHR",
		Company: "CHRISTMANN INFORMATIONSTECHNIK + MEDIEN GMBH & CO. KG",
		Date:    "05/25/2017",
	},
	{
		ID:      "CVP",
		Company: "CHROMATEC VIDEO PRODUCTS LTD",
		Date:    "08/09/2013",
	},
	{
		ID:      "CHI",
		Company: "CHRONTEL INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "CGA",
		Company: "CHUNGHWA PICTURE TUBES, LTD",
		Date:    "01/01/1994",
	},
	{
		ID:      "CHT",
		Company: "CHUNGHWA PICTURE TUBES,LTD.",
		Date:    "03/15/2001",
	},
	{
		ID:      "CTE",
		Company: "CHUNGHWA TELECOM CO., LTD.",
		Date:    "05/16/2002",
	},
	{
		ID:      "KCD",
		Company: "CHUNICHI DENSHI CO.,LTD.",
		Date:    "12/23/2010",
	},
	{
		ID:      "QQQ",
		Company: "CHUOMUSEN CO., LTD.",
		Date:    "08/07/2002",
	},
	{
		ID:      "CGS",
		Company: "CHYRON CORP",
		Date:    "11/13/2008",
	},
	{
		ID:      "CNE",
		Company: "CINE-TAL",
		Date:    "06/13/2007",
	},
	{
		ID:      "PTG",
		Company: "CIPHER SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "CIP",
		Company: "CIPRICO INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "CPC",
		Company: "CIPRICO INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "FPX",
		Company: "CIREL SYSTEMES",
		Date:    "11/29/1996",
	},
	{
		ID:      "CRQ",
		Company: "CIRQUE CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "CIR",
		Company: "CIRRUS LOGIC INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "CLI",
		Company: "CIRRUS LOGIC INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "SNS",
		Company: "CIRTECH (UK) LTD",
		Date:    "08/20/1997",
	},
	{
		ID:      "WSC",
		Company: "CIS TECHNOLOGY INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "CIS",
		Company: "CISCO SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "CIL",
		Company: "CITICOM INFOTECH PRIVATE LIMITED",
		Date:    "08/10/2000",
	},
	{
		ID:      "CIT",
		Company: "CITIFAX LIMITED",
		Date:    "07/16/1997",
	},
	{
		ID:      "CIN",
		Company: "CITRON GMBH",
		Date:    "07/28/2005",
	},
	{
		ID:      "CLA",
		Company: "CLARION COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "CVS",
		Company: "CLARITY VISUAL SYSTEMS",
		Date:    "01/13/2000",
	},
	{
		ID:      "CLE",
		Company: "CLASSE AUDIO",
		Date:    "02/16/2006",
	},
	{
		ID:      "CLV",
		Company: "CLEVO COMPANY",
		Date:    "01/30/1998",
	},
	{
		ID:      "PPM",
		Company: "CLINTON ELECTRONICS CORP.",
		Date:    "10/01/2003",
	},
	{
		ID:      "CLO",
		Company: "CLONE COMPUTERS",
		Date:    "11/29/1996",
	},
	{
		ID:      "CSL",
		Company: "CLOUDIUM SYSTEMS LTD.",
		Date:    "02/14/2013",
	},
	{
		ID:      "CMC",
		Company: "CMC LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "JQE",
		Company: "CNET TECHNICAL INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "COB",
		Company: "COBY ELECTRONICS CO., LTD",
		Date:    "06/13/2007",
	},
	{
		ID:      "COD",
		Company: "CODAN PTY. LTD.",
		Date:    "10/23/2000",
	},
	{
		ID:      "COI",
		Company: "CODEC INC.",
		Date:    "11/30/2001",
	},
	{
		ID:      "CDN",
		Company: "CODENOLL TECHNICAL CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "CNT",
		Company: "COINT MULTIMEDIA SYSTEMS",
		Date:    "03/20/1999",
	},
	{
		ID:      "CDE",
		Company: "COLIN.DE",
		Date:    "01/18/2005",
	},
	{
		ID:      "CMD",
		Company: "COLORADO MICRODISPLAY, INC.",
		Date:    "03/20/1999",
	},
	{
		ID:      "CVI",
		Company: "COLORADO VIDEO, INC.",
		Date:    "08/15/2012",
	},
	{
		ID:      "MVX",
		Company: "COM 1",
		Date:    "11/29/1996",
	},
	{
		ID:      "CMK",
		Company: "COMARK LLC",
		Date:    "07/15/2020",
	},
	{
		ID:      "CMX",
		Company: "COMEX ELECTRONICS AB",
		Date:    "05/28/2004",
	},
	{
		ID:      "CIC",
		Company: "COMM. INTELLIGENCE CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "CLD",
		Company: "COMMAT L.T.D.",
		Date:    "08/10/2000",
	},
	{
		ID:      "SDH",
		Company: "COMMUNICATIONS SPECIALIES, INC.",
		Date:    "09/06/2005",
	},
	{
		ID:      "INX",
		Company: "COMMUNICATIONS SUPPLY CORPORATION (A DIVISION OF WESCO)",
		Date:    "11/07/2012",
	},
	{
		ID:      "CPL",
		Company: "COMPAL ELECTRONICS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "CPQ",
		Company: "COMPAQ COMPUTER COMPANY",
		Date:    "11/29/1996",
	},
	{
		ID:      "CPP",
		Company: "COMPOUND PHOTONICS",
		Date:    "10/01/2013",
	},
	{
		ID:      "CPD",
		Company: "COMPUADD",
		Date:    "11/29/1996",
	},
	{
		ID:      "CMS",
		Company: "COMPUMASTER SRL",
		Date:    "02/22/1999",
	},
	{
		ID:      "CDS",
		Company: "COMPUTER DIAGNOSTIC SYSTEMS",
		Date:    "03/15/2001",
	},
	{
		ID:      "CPI",
		Company: "COMPUTER PERIPHERALS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "CTP",
		Company: "COMPUTER TECHNOLOGY CORPORATION",
		Date:    "03/26/1998",
	},
	{
		ID:      "CBI",
		Company: "COMPUTERBOARDS INC",
		Date:    "02/03/1998",
	},
	{
		ID:      "CTM",
		Company: "COMPUTERM CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "CTN",
		Company: "COMPUTONE PRODUCTS",
		Date:    "11/29/1996",
	},
	{
		ID:      "COX",
		Company: "COMREX",
		Date:    "10/18/2011",
	},
	{
		ID:      "CTS",
		Company: "COMTEC SYSTEMS CO., LTD.",
		Date:    "04/25/2002",
	},
	{
		ID:      "CMM",
		Company: "COMTIME GMBH",
		Date:    "09/23/2002",
	},
	{
		ID:      "COM",
		Company: "COMTROL CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "CDI",
		Company: "CONCEPT DEVELOPMENT INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "CSE",
		Company: "CONCEPT SOLUTIONS & ENGINEERING",
		Date:    "12/11/1996",
	},
	{
		ID:      "DCI",
		Company: "CONCEPTS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "CXT",
		Company: "CONEXANT SYSTEMS",
		Date:    "01/20/1999",
	},
	{
		ID:      "CGT",
		Company: "CONGATEC AG",
		Date:    "06/16/2011",
	},
	{
		ID:      "CNI",
		Company: "CONNECT INT'L A/S",
		Date:    "11/29/1996",
	},
	{
		ID:      "CWR",
		Company: "CONNECTWARE INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "CRC",
		Company: "CONRAC GMBH",
		Date:    "04/20/2004",
	},
	{
		ID:      "CAT",
		Company: "CONSULTANCY IN ADVANCED TECHNOLOGY",
		Date:    "09/19/1997",
	},
	{
		ID:      "CEA",
		Company: "CONSUMER ELECTRONICS ASSOCIATION",
		Date:    "09/05/2006",
	},
	{
		ID:      "CCJ",
		Company: "CONTEC CO.,LTD.",
		Date:    "08/10/2000",
	},
	{
		ID:      "CON",
		Company: "CONTEC COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "CRH",
		Company: "CONTEMPORARY RESEARCH CORP.",
		Date:    "02/24/2015",
	},
	{
		ID:      "CTR",
		Company: "CONTROL4 CORPORATION",
		Date:    "05/28/2014",
	},
	{
		ID:      "CDD",
		Company: "CONVERGENT DATA DEVICES",
		Date:    "02/27/2004",
	},
	{
		ID:      "CDV",
		Company: "CONVERGENT DESIGN INC.",
		Date:    "09/05/2006",
	},
	{
		ID:      "CIE",
		Company: "CONVERGENT ENGINEERING, INC.",
		Date:    "09/05/2018",
	},
	{
		ID:      "COO",
		Company: "COOLUX GMBH",
		Date:    "09/30/2010",
	},
	{
		ID:      "CDC",
		Company: "CORE DYNAMICS CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "COT",
		Company: "CORE TECHNOLOGY INC",
		Date:    "04/19/2000",
	},
	{
		ID:      "CLG",
		Company: "CORELOGIC",
		Date:    "11/27/1998",
	},
	{
		ID:      "ART",
		Company: "CORION INDUSTRIAL CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "CRN",
		Company: "CORNERSTONE IMAGING",
		Date:    "11/29/1996",
	},
	{
		ID:      "COR",
		Company: "COROLLARY INC",
		Date:    "12/13/1996",
	},
	{
		ID:      "CSM",
		Company: "COSMIC ENGINEERING INC.",
		Date:    "04/18/2012",
	},
	{
		ID:      "COS",
		Company: "COSTAR CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "CTA",
		Company: "COSYSTEMS INC",
		Date:    "10/24/1998",
	},
	{
		ID:      "CVA",
		Company: "COVIA INC.",
		Date:    "05/11/2010",
	},
	{
		ID:      "CPT",
		Company: "CPATH",
		Date:    "03/09/1998",
	},
	{
		ID:      "CRA",
		Company: "CRALTECH ELECTRONICA, S.L.",
		Date:    "03/24/2015",
	},
	{
		ID:      "CDK",
		Company: "CRAY COMMUNICATIONS",
		Date:    "11/29/1996",
	},
	{
		ID:      "IOA",
		Company: "CRE TECHNOLOGY CORPORATION",
		Date:    "06/30/1997",
	},
	{
		ID:      "CRE",
		Company: "CREATIVE LABS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "CRL",
		Company: "CREATIVE LOGIC  ",
		Date:    "10/16/1997",
	},
	{
		ID:      "CTL",
		Company: "CREATIVE TECHNOLOGY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "CTX",
		Company: "CREATIX POLYMEDIA GMBH",
		Date:    "11/29/1996",
	},
	{
		ID:      "CRS",
		Company: "CRESCENDO COMMUNICATION INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "CSD",
		Company: "CRESTA SYSTEMS INC",
		Date:    "08/01/1997",
	},
	{
		ID:      "CEI",
		Company: "CRESTRON ELECTRONICS, INC.",
		Date:    "05/08/2006",
	},
	{
		ID:      "CRI",
		Company: "CRIO INC.",
		Date:    "09/13/1999",
	},
	{
		ID:      "CII",
		Company: "CROMACK INDUSTRIES INC",
		Date:    "01/22/1997",
	},
	{
		ID:      "XTL",
		Company: "CRYSTAL COMPUTER",
		Date:    "11/29/1996",
	},
	{
		ID:      "CSC",
		Company: "CRYSTAL SEMICONDUCTOR",
		Date:    "11/29/1996",
	},
	{
		ID:      "CLM",
		Company: "CRYSTALAKE MULTIMEDIA",
		Date:    "11/29/1996",
	},
	{
		ID:      "CSS",
		Company: "CSS LABORATORIES",
		Date:    "01/02/1997",
	},
	{
		ID:      "CST",
		Company: "CSTI INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "CTC",
		Company: "CTC COMMUNICATION DEVELOPMENT COMPANY LTD",
		Date:    "10/21/1997",
	},
	{
		ID:      "CUB",
		Company: "CUBIX CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "CWC",
		Company: "CURTISS-WRIGHT CONTROLS, INC.",
		Date:    "04/05/2013",
	},
	{
		ID:      "CYL",
		Company: "CYBERLABS",
		Date:    "04/14/1998",
	},
	{
		ID:      "CYB",
		Company: "CYBERVISION",
		Date:    "05/13/1997",
	},
	{
		ID:      "CYW",
		Company: "CYBERWARE",
		Date:    "02/21/2000",
	},
	{
		ID:      "CBX",
		Company: "CYBEX COMPUTER PRODUCTS CORPORATION",
		Date:    "11/08/1999",
	},
	{
		ID:      "CYD",
		Company: "CYCLADES CORPORATION",
		Date:    "05/07/2001",
	},
	{
		ID:      "CYC",
		Company: "CYLINK CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "CYP",
		Company: "CYPRESS SEMICONDUCTOR CORPORATION",
		Date:    "05/25/2016",
	},
	{
		ID:      "CYX",
		Company: "CYRIX CORPORATION",
		Date:    "10/21/1997",
	},
	{
		ID:      "CRX",
		Company: "CYRIX CORPORATION",
		Date:    "03/21/1997",
	},
	{
		ID:      "CYT",
		Company: "CYTECHINFO INC",
		Date:    "03/13/1998",
	},
	{
		ID:      "CYV",
		Company: "CYVIZ AS",
		Date:    "04/25/2002",
	},
	{
		ID:      "DMP",
		Company: "D&M HOLDINGS INC, PROFESSIONAL BUSINESS COMPANY",
		Date:    "09/05/2006",
	},
	{
		ID:      "ABO",
		Company: "D-LINK SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "DLK",
		Company: "D-LINK SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "OPI",
		Company: "D.N.S. CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "DDA",
		Company: "DA2 TECHNOLOGIES CORPORATION",
		Date:    "03/13/2006",
	},
	{
		ID:      "DAW",
		Company: "DA2 TECHNOLOGIES INC",
		Date:    "09/06/2005",
	},
	{
		ID:      "DWE",
		Company: "DAEWOO ELECTRONICS COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "TLT",
		Company: "DAI TELECOM S.P.A.",
		Date:    "06/04/2003",
	},
	{
		ID:      "DIN",
		Company: "DAINTELECOM CO., LTD",
		Date:    "11/08/1999",
	},
	{
		ID:      "DAI",
		Company: "DAIS SET LTD.",
		Date:    "02/21/2000",
	},
	{
		ID:      "DAK",
		Company: "DAKTRONICS",
		Date:    "06/23/2004",
	},
	{
		ID:      "DCC",
		Company: "DALE COMPUTER CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "DCT",
		Company: "DANCALL TELECOM A/S",
		Date:    "08/12/1997",
	},
	{
		ID:      "DAN",
		Company: "DANELEC MARINE A/S",
		Date:    "12/24/2009",
	},
	{
		ID:      "DDD",
		Company: "DANKA DATA DEVICES",
		Date:    "11/29/1996",
	},
	{
		ID:      "DAU",
		Company: "DAOU TECH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "HCA",
		Company: "DAT",
		Date:    "03/15/2001",
	},
	{
		ID:      "DAX",
		Company: "DATA APEX LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "DDI",
		Company: "DATA DISPLAY AG",
		Date:    "07/17/2002",
	},
	{
		ID:      "DXP",
		Company: "DATA EXPERT CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "EXP",
		Company: "DATA EXPORT CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "DGC",
		Company: "DATA GENERAL CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "DMO",
		Company: "DATA MODUL AG",
		Date:    "12/03/2013",
	},
	{
		ID:      "EBH",
		Company: "DATA PRICE INFORMATICA",
		Date:    "05/24/2001",
	},
	{
		ID:      "DRI",
		Company: "DATA RACE INC",
		Date:    "07/30/1997",
	},
	{
		ID:      "DRC",
		Company: "DATA RAY CORP.",
		Date:    "11/30/2001",
	},
	{
		ID:      "DTX",
		Company: "DATA TRANSLATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "DVT",
		Company: "DATA VIDEO",
		Date:    "02/13/2007",
	},
	{
		ID:      "DBK",
		Company: "DATABOOK INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "DCD",
		Company: "DATACAST LLC",
		Date:    "12/02/1997",
	},
	{
		ID:      "TRN",
		Company: "DATACOMMUNICATIE TRON B.V.",
		Date:    "11/29/1996",
	},
	{
		ID:      "DQB",
		Company: "DATACUBE INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "DDT",
		Company: "DATADESK TECHNOLOGIES INC",
		Date:    "11/27/1998",
	},
	{
		ID:      "DKY",
		Company: "DATAKEY INC",
		Date:    "04/06/1998",
	},
	{
		ID:      "LJX",
		Company: "DATALOGIC CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "DTN",
		Company: "DATANG TELEPHONE CO",
		Date:    "09/23/1998",
	},
	{
		ID:      "DII",
		Company: "DATAQ INSTRUMENTS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "DDE",
		Company: "DATASAT DIGITAL ENTERTAINMENT",
		Date:    "11/18/2011",
	},
	{
		ID:      "DCV",
		Company: "DATATRONICS TECHNOLOGY INC",
		Date:    "01/02/1997",
	},
	{
		ID:      "DAT",
		Company: "DATEL INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "MSD",
		Company: "DATENERFASSUNGS- UND INFORMATIONSSYSTEME",
		Date:    "03/16/1998",
	},
	{
		ID:      "DAV",
		Company: "DAVICOM SEMICONDUCTOR INC",
		Date:    "01/15/1997",
	},
	{
		ID:      "DAS",
		Company: "DAVIS AS",
		Date:    "02/03/1998",
	},
	{
		ID:      "DBN",
		Company: "DB NETWORKS INC",
		Date:    "12/01/1997",
	},
	{
		ID:      "HWC",
		Company: "DBA HANS WEDEMEYER",
		Date:    "03/20/1999",
	},
	{
		ID:      "DCM",
		Company: "DCM DATA PRODUCTS",
		Date:    "11/29/1996",
	},
	{
		ID:      "DGT",
		Company: "DEARBORN GROUP TECHNOLOGY",
		Date:    "11/11/1997",
	},
	{
		ID:      "DXD",
		Company: "DECIMATOR DESIGN PTY LTD",
		Date:    "03/06/2012",
	},
	{
		ID:      "DCR",
		Company: "DECROS LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "MLD",
		Company: "DEEP VIDEO IMAGING LTD",
		Date:    "08/14/2003",
	},
	{
		ID:      "DFT",
		Company: "DEI HOLDINGS DBA DEFINITIVE TECHNOLOGY",
		Date:    "12/09/2011",
	},
	{
		ID:      "DEI",
		Company: "DEICO ELECTRONICS",
		Date:    "11/29/1996",
	},
	{
		ID:      "DLL",
		Company: "DELL INC",
		Date:    "03/27/2009",
	},
	{
		ID:      "DEL",
		Company: "DELL INC.",
		Date:    "12/09/2009",
	},
	{
		ID:      "DPH",
		Company: "DELPHI AUTOMOTIVE LLP",
		Date:    "10/15/2013",
	},
	{
		ID:      "DPC",
		Company: "DELTA ELECTRONICS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "DDV",
		Company: "DELTA INFORMATION SYSTEMS, INC",
		Date:    "01/03/2012",
	},
	{
		ID:      "DTA",
		Company: "DELTATEC",
		Date:    "03/13/2009",
	},
	{
		ID:      "FPS",
		Company: "DELTEC CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "DON",
		Company: "DENON, LTD.",
		Date:    "04/01/2004",
	},
	{
		ID:      "DHD",
		Company: "DENSION AUDIO SYSTEMS",
		Date:    "03/04/2013",
	},
	{
		ID:      "DEN",
		Company: "DENSITRON COMPUTERS LTD",
		Date:    "09/13/1999",
	},
	{
		ID:      "DTT",
		Company: "DESIGN & TEST TECHNOLOGY, INC.",
		Date:    "09/30/2010",
	},
	{
		ID:      "LPI",
		Company: "DESIGN TECHNOLOGY",
		Date:    "11/29/1996",
	},
	{
		ID:      "DNI",
		Company: "DETERMINISTIC NETWORKS INC.",
		Date:    "04/19/2000",
	},
	{
		ID:      "BCQ",
		Company: "DEUTSCHE TELEKOM BERKOM GMBH",
		Date:    "08/12/1997",
	},
	{
		ID:      "DTO",
		Company: "DEUTSCHE THOMSON OHG",
		Date:    "06/14/2007",
	},
	{
		ID:      "DVL",
		Company: "DEVOLO AG",
		Date:    "05/30/2002",
	},
	{
		ID:      "DXL",
		Company: "DEXTERA LABS INC",
		Date:    "12/09/2009",
	},
	{
		ID:      "DFI",
		Company: "DFI",
		Date:    "11/29/1996",
	},
	{
		ID:      "DHP",
		Company: "DH PRINT",
		Date:    "11/29/1996",
	},
	{
		ID:      "DIA",
		Company: "DIADEM",
		Date:    "11/29/1996",
	},
	{
		ID:      "DGS",
		Company: "DIAGSOFT INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "DCO",
		Company: "DIALOGUE TECHNOLOGY CORPORATION",
		Date:    "06/16/2004",
	},
	{
		ID:      "DCS",
		Company: "DIAMOND COMPUTER SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "DLC",
		Company: "DIAMOND LANE COMM. CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "DNV",
		Company: "DICON",
		Date:    "12/15/2004",
	},
	{
		ID:      "DVD",
		Company: "DICTAPHONE CORPORATION",
		Date:    "04/03/1998",
	},
	{
		ID:      "DBD",
		Company: "DIEBOLD INC.",
		Date:    "09/05/2006",
	},
	{
		ID:      "WNX",
		Company: "DIEBOLD NIXDORF SYSTEMS GMBH",
		Date:    "09/20/2004",
	},
	{
		ID:      "DAE",
		Company: "DIGATRON INDUSTRIE ELEKTRONIK GMBH",
		Date:    "02/24/1997",
	},
	{
		ID:      "DGI",
		Company: "DIGI INTERNATIONAL",
		Date:    "11/29/1996",
	},
	{
		ID:      "DBI",
		Company: "DIGIBOARD INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "DIG",
		Company: "DIGICOM S.P.A.",
		Date:    "11/29/1996",
	},
	{
		ID:      "DMB",
		Company: "DIGICOM SYSTEMS INC",
		Date:    "03/13/1998",
	},
	{
		ID:      "DGP",
		Company: "DIGICORP EUROPEAN SALES S.A.",
		Date:    "05/22/1997",
	},
	{
		ID:      "DGA",
		Company: "DIGIITAL ARTS INC",
		Date:    "06/14/2007",
	},
	{
		ID:      "DXC",
		Company: "DIGIPRONIX CONTROL SYSTEMS",
		Date:    "07/16/1999",
	},
	{
		ID:      "DAC",
		Company: "DIGITAL ACOUSTICS CORPORATION",
		Date:    "05/24/2000",
	},
	{
		ID:      "DAL",
		Company: "DIGITAL AUDIO LABS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "DCA",
		Company: "DIGITAL COMMUNICATIONS ASSOCIATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "SHR",
		Company: "DIGITAL DISCOVERY",
		Date:    "09/24/1997",
	},
	{
		ID:      "DEC",
		Company: "DIGITAL EQUIPMENT CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "DPS",
		Company: "DIGITAL PROCESSING SYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "DPL",
		Company: "DIGITAL PROJECTION LIMITED",
		Date:    "07/09/2002",
	},
	{
		ID:      "DRD",
		Company: "DIGITAL REFLECTION INC.",
		Date:    "02/21/2000",
	},
	{
		ID:      "DVS",
		Company: "DIGITAL VIDEO SYSTEM",
		Date:    "11/29/1996",
	},
	{
		ID:      "DLG",
		Company: "DIGITAL-LOGIC GMBH",
		Date:    "09/02/2003",
	},
	{
		ID:      "DPA",
		Company: "DIGITALK PRO AV",
		Date:    "10/23/2000",
	},
	{
		ID:      "DSI",
		Company: "DIGITAN SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "DLT",
		Company: "DIGITELEC INFORMATIQUE PARK CADERA",
		Date:    "11/29/1996",
	},
	{
		ID:      "DMN",
		Company: "DIMENSION ENGINEERING LLC",
		Date:    "02/06/2019",
	},
	{
		ID:      "DTE",
		Company: "DIMENSION TECHNOLOGIES, INC.",
		Date:    "05/03/2010",
	},
	{
		ID:      "DMM",
		Company: "DIMOND MULTIMEDIA SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "DIS",
		Company: "DISEDA S.A.",
		Date:    "11/29/1996",
	},
	{
		ID:      "DSG",
		Company: "DISGUISE TECHNOLOGIES",
		Date:    "10/22/2019",
	},
	{
		ID:      "DSA",
		Company: "DISPLAY SOLUTION AG",
		Date:    "02/03/2016",
	},
	{
		ID:      "DMT",
		Company: "DISTRIBUTED MANAGEMENT TASK FORCE, INC. (DMTF)",
		Date:    "03/31/2009",
	},
	{
		ID:      "DTI",
		Company: "DIVERSIFIED TECHNOLOGY, INC.",
		Date:    "11/29/1996",
	},
	{
		ID:      "DNA",
		Company: "DNA ENTERPRISES, INC.",
		Date:    "09/01/1998",
	},
	{
		ID:      "AUO",
		Company: "DO NOT USE - AUO",
		Date:    "09/16/2008",
	},
	{
		ID:      "LPL",
		Company: "DO NOT USE - LPL",
		Date:    "09/16/2008",
	},
	{
		ID:      "PHI",
		Company: "DO NOT USE - PHI",
		Date:    "11/29/1996",
	},
	{
		ID:      "PTW",
		Company: "DO NOT USE - PTW",
		Date:    "09/09/2009",
	},
	{
		ID:      "PVC",
		Company: "DO NOT USE - PVC",
		Date:    "09/09/2009",
	},
	{
		ID:      "RTK",
		Company: "DO NOT USE - RTK",
		Date:    "09/09/2009",
	},
	{
		ID:      "SEG",
		Company: "DO NOT USE - SEG",
		Date:    "09/09/2009",
	},
	{
		ID:      "TNJ",
		Company: "DO NOT USE - TNJ",
		Date:    "09/09/2009",
	},
	{
		ID:      "UND",
		Company: "DO NOT USE - UND",
		Date:    "11/29/1996",
	},
	{
		ID:      "UNE",
		Company: "DO NOT USE - UNE",
		Date:    "11/29/1996",
	},
	{
		ID:      "UNF",
		Company: "DO NOT USE - UNF",
		Date:    "11/29/1996",
	},
	{
		ID:      "WAN",
		Company: "DO NOT USE - WAN",
		Date:    "09/09/2009",
	},
	{
		ID:      "XER",
		Company: "DO NOT USE - XER",
		Date:    "09/09/2009",
	},
	{
		ID:      "XOC",
		Company: "DO NOT USE - XOC",
		Date:    "09/09/2009",
	},
	{
		ID:      "DBL",
		Company: "DOBLE ENGINEERING COMPANY",
		Date:    "11/29/1996",
	},
	{
		ID:      "DPI",
		Company: "DOCUPOINT",
		Date:    "11/29/1996",
	},
	{
		ID:      "DLB",
		Company: "DOLBY LABORATORIES INC.",
		Date:    "01/27/2010",
	},
	{
		ID:      "DOL",
		Company: "DOLMAN TECHNOLOGIES GROUP INC",
		Date:    "11/11/1997",
	},
	{
		ID:      "DSP",
		Company: "DOMAIN TECHNOLOGY INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "DMS",
		Company: "DOME IMAGING SYSTEMS",
		Date:    "10/23/2000",
	},
	{
		ID:      "DOM",
		Company: "DOME IMAGING SYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "AIK",
		Company: "DONGGUAN ALLLIKE ELECTRONICS CO., LTD.",
		Date:    "04/11/2015",
	},
	{
		ID:      "DUA",
		Company: "DOSCH & AMAND GMBH & COMPANY KG",
		Date:    "12/02/1997",
	},
	{
		ID:      "DOT",
		Company: "DOTRONIC MIKROELEKTRONIK GMBH",
		Date:    "06/28/2002",
	},
	{
		ID:      "DIM",
		Company: "DPICT IMAGING, INC.",
		Date:    "02/12/2008",
	},
	{
		ID:      "DPX",
		Company: "DPIX, INC.",
		Date:    "09/23/1998",
	},
	{
		ID:      "DPT",
		Company: "DPT",
		Date:    "11/29/1996",
	},
	{
		ID:      "DRB",
		Company: "DR. BOTT KG",
		Date:    "04/25/2002",
	},
	{
		ID:      "DNT",
		Company: "DR. NEUHOUS TELEKOMMUNIKATION GMBH",
		Date:    "11/29/1996",
	},
	{
		ID:      "DIT",
		Company: "DRAGON INFORMATION TECHNOLOGY",
		Date:    "11/29/1996",
	},
	{
		ID:      "DRS",
		Company: "DRS DEFENSE SOLUTIONS, LLC",
		Date:    "10/18/2011",
	},
	{
		ID:      "DSD",
		Company: "DS MULTIMEDIA PTE LTD",
		Date:    "02/14/2006",
	},
	{
		ID:      "DSM",
		Company: "DSM DIGITAL SERVICES GMBH",
		Date:    "11/29/1996",
	},
	{
		ID:      "DCE",
		Company: "DSPACE GMBH",
		Date:    "12/16/1996",
	},
	{
		ID:      "DTC",
		Company: "DTC TECH CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "DGK",
		Company: "DUGOTECH CO., LTD",
		Date:    "06/14/2007",
	},
	{
		ID:      "DMC",
		Company: "DUNE MICROSYSTEMS CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "DYC",
		Company: "DYCAM INC",
		Date:    "01/08/1998",
	},
	{
		ID:      "DYM",
		Company: "DYMO-COSTAR CORPORATION",
		Date:    "12/28/1998",
	},
	{
		ID:      "TOS",
		Company: "DYNABOOK INC.",
		Date:    "11/29/1996",
	},
	{
		ID:      "DCL",
		Company: "DYNAMIC CONTROLS LTD",
		Date:    "05/24/2000",
	},
	{
		ID:      "DTK",
		Company: "DYNAX ELECTRONICS (HK) LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "DYX",
		Company: "DYNAX ELECTRONICS (HK) LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "ECM",
		Company: "E-CMOS TECH CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "DTL",
		Company: "E-NET INC",
		Date:    "10/16/1997",
	},
	{
		ID:      "ESY",
		Company: "E-SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ETT",
		Company: "E-TECH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "EDC",
		Company: "E.DIGITAL CORPORATION",
		Date:    "10/23/2000",
	},
	{
		ID:      "EEP",
		Company: "E.E.P.D. GMBH",
		Date:    "06/14/2007",
	},
	{
		ID:      "EGL",
		Company: "EAGLE TECHNOLOGY",
		Date:    "11/29/1996",
	},
	{
		ID:      "KOD",
		Company: "EASTMAN KODAK COMPANY",
		Date:    "05/24/2000",
	},
	{
		ID:      "EKC",
		Company: "EASTMAN KODAK COMPANY",
		Date:    "11/29/1996",
	},
	{
		ID:      "TWI",
		Company: "EASYTEL OY",
		Date:    "07/16/1999",
	},
	{
		ID:      "EBS",
		Company: "EBS EUCHNER BÜRO- UND SCHULSYSTEME GMBH",
		Date:    "02/05/2013",
	},
	{
		ID:      "ECO",
		Company: "ECHO SPEECH CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "ECH",
		Company: "ECHOSTAR CORPORATION",
		Date:    "02/26/2016",
	},
	{
		ID:      "ETI",
		Company: "ECLIPSE TECH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ESC",
		Company: "EDEN SISTEMAS DE COMPUTACAO S/A",
		Date:    "11/29/1996",
	},
	{
		ID:      "EDI",
		Company: "EDIMAX TECH. COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "EDM",
		Company: "EDMI",
		Date:    "07/16/1998",
	},
	{
		ID:      "ELI",
		Company: "EDSUN LABORATORIES",
		Date:    "11/29/1996",
	},
	{
		ID:      "EES",
		Company: "EE SOLUTIONS, INC.",
		Date:    "04/16/2003",
	},
	{
		ID:      "EEH",
		Company: "EEH DATALINK GMBH",
		Date:    "07/03/1997",
	},
	{
		ID:      "ENI",
		Company: "EFFICIENT NETWORKS",
		Date:    "11/29/1996",
	},
	{
		ID:      "EGN",
		Company: "EGENERA, INC.",
		Date:    "10/08/2002",
	},
	{
		ID:      "EIC",
		Company: "EICON TECHNOLOGY CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "EGD",
		Company: "EIZO GMBH DISPLAY TECHNOLOGIES",
		Date:    "02/13/2009",
	},
	{
		ID:      "ENC",
		Company: "EIZO NANAO CORPORATION",
		Date:    "12/28/1998",
	},
	{
		ID:      "ERS",
		Company: "EIZO RUGGED SOLUTIONS",
		Date:    "05/25/2016",
	},
	{
		ID:      "EKS",
		Company: "EKSEN YAZILIM",
		Date:    "04/25/2002",
	},
	{
		ID:      "LPE",
		Company: "EL-PUSK CO., LTD.",
		Date:    "08/14/2001",
	},
	{
		ID:      "ELA",
		Company: "ELAD SRL",
		Date:    "04/25/2002",
	},
	{
		ID:      "ETD",
		Company: "ELAN MICROELECTRONICS CORPORATION",
		Date:    "11/03/2009",
	},
	{
		ID:      "TSH",
		Company: "ELAN MICROELECTRONICS CORPORATION",
		Date:    "11/14/2014",
	},
	{
		ID:      "ESA",
		Company: "ELBIT SYSTEMS OF AMERICA",
		Date:    "06/15/2009",
	},
	{
		ID:      "ESG",
		Company: "ELCON SYSTEMTECHNIK GMBH",
		Date:    "07/16/1999",
	},
	{
		ID:      "LXS",
		Company: "ELEA CARDWARE",
		Date:    "06/25/1998",
	},
	{
		ID:      "ECP",
		Company: "ELECOM COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "ELE",
		Company: "ELECOM COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "ECA",
		Company: "ELECTRO CAM CORP.",
		Date:    "08/10/2000",
	},
	{
		ID:      "ELC",
		Company: "ELECTRO SCIENTIFIC IND",
		Date:    "11/29/1996",
	},
	{
		ID:      "MMM",
		Company: "ELECTRONIC MEASUREMENTS",
		Date:    "11/29/1996",
	},
	{
		ID:      "ETS",
		Company: "ELECTRONIC TRADE SOLUTIONS LTD",
		Date:    "08/20/2002",
	},
	{
		ID:      "EDG",
		Company: "ELECTRONIC-DESIGN GMBH",
		Date:    "08/12/1997",
	},
	{
		ID:      "ELL",
		Company: "ELECTROSONIC LTD",
		Date:    "09/13/1999",
	},
	{
		ID:      "EIN",
		Company: "ELEGANT INVENTION",
		Date:    "03/29/2018",
	},
	{
		ID:      "ELT",
		Company: "ELEMENT LABS, INC.",
		Date:    "10/11/2007",
	},
	{
		ID:      "EGA",
		Company: "ELGATO SYSTEMS LLC",
		Date:    "02/08/2011",
	},
	{
		ID:      "ECS",
		Company: "ELITEGROUP COMPUTER SYSTEMS COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "UEG",
		Company: "ELITEGROUP COMPUTER SYSTEMS COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "ELG",
		Company: "ELMEG GMBH KOMMUNIKATIONSTECHNIK",
		Date:    "11/29/1996",
	},
	{
		ID:      "ELM",
		Company: "ELMIC SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "EMO",
		Company: "ELMO COMPANY, LIMITED",
		Date:    "06/26/2012",
	},
	{
		ID:      "ELO",
		Company: "ELO TOUCHSYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ELX",
		Company: "ELONEX PLC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ELS",
		Company: "ELSA GMBH",
		Date:    "11/29/1996",
	},
	{
		ID:      "EAG",
		Company: "ELTEC ELEKTRONIK AG",
		Date:    "11/25/2014",
	},
	{
		ID:      "EMB",
		Company: "EMBEDDED COMPUTING INC LTD",
		Date:    "02/25/2002",
	},
	{
		ID:      "EST",
		Company: "EMBEDDED SOLUTION TECHNOLOGY",
		Date:    "05/24/2000",
	},
	{
		ID:      "EMD",
		Company: "EMBRIONIX DESIGN INC.",
		Date:    "07/24/2013",
	},
	{
		ID:      "EMK",
		Company: "EMCORE CORPORATION",
		Date:    "05/31/2012",
	},
	{
		ID:      "EDT",
		Company: "EMERGING DISPLAY TECHNOLOGIES CORP",
		Date:    "08/18/2009",
	},
	{
		ID:      "EMG",
		Company: "EMG CONSULTANTS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "EMC",
		Company: "EMICRO CORPORATION",
		Date:    "01/01/1994",
	},
	{
		ID:      "EME",
		Company: "EMINE TECHNOLOGY COMPANY, LTD.",
		Date:    "06/16/2005",
	},
	{
		ID:      "EPC",
		Company: "EMPAC",
		Date:    "12/04/1996",
	},
	{
		ID:      "EMU",
		Company: "EMULEX CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "ECI",
		Company: "ENCIRIS TECHNOLOGIES",
		Date:    "11/01/2008",
	},
	{
		ID:      "ECT",
		Company: "ENCIRIS TECHNOLOGIES",
		Date:    "11/01/2008",
	},
	{
		ID:      "ENE",
		Company: "ENE TECHNOLOGY INC.",
		Date:    "03/15/2001",
	},
	{
		ID:      "EHN",
		Company: "ENHANSOFT",
		Date:    "11/16/2010",
	},
	{
		ID:      "END",
		Company: "ENIDAN TECHNOLOGIES LTD",
		Date:    "04/19/2000",
	},
	{
		ID:      "ESD",
		Company: "ENSEMBLE DESIGNS, INC",
		Date:    "12/09/2009",
	},
	{
		ID:      "ENS",
		Company: "ENSONIQ CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "ENT",
		Company: "ENTERPRISE COMM. & COMPUTING INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "EPI",
		Company: "ENVISION PERIPHERALS, INC",
		Date:    "02/22/1999",
	},
	{
		ID:      "EON",
		Company: "EON INSTRUMENTATION, INC.",
		Date:    "01/15/2015",
	},
	{
		ID:      "EPN",
		Company: "EPICON INC.",
		Date:    "09/23/1998",
	},
	{
		ID:      "EPH ",
		Company: "EPIPHAN SYSTEMS INC. ",
		Date:    "03/14/2011",
	},
	{
		ID:      "EHJ",
		Company: "EPSON RESEARCH",
		Date:    "11/29/1996",
	},
	{
		ID:      "EQX",
		Company: "EQUINOX SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "EQP",
		Company: "EQUIPE ELECTRONICS LTD.",
		Date:    "07/14/2005",
	},
	{
		ID:      "EGO",
		Company: "ERGO ELECTRONICS",
		Date:    "11/29/1996",
	},
	{
		ID:      "ERG",
		Company: "ERGO SYSTEM",
		Date:    "11/29/1996",
	},
	{
		ID:      "ERI",
		Company: "ERICSSON MOBILE COMMUNICATIONS AB",
		Date:    "10/22/1997",
	},
	{
		ID:      "EUT",
		Company: "ERICSSON MOBILE NETWORKS B.V.",
		Date:    "04/14/1998",
	},
	{
		ID:      "ERN",
		Company: "ERICSSON, INC.",
		Date:    "09/23/1998",
	},
	{
		ID:      "ESK",
		Company: "ES&S",
		Date:    "11/08/1999",
	},
	{
		ID:      "ESN",
		Company: "ESATURNUS",
		Date:    "02/21/2012",
	},
	{
		ID:      "ERT",
		Company: "ESCORT INSTURMENTS CORPORATION",
		Date:    "05/02/1997",
	},
	{
		ID:      "ESS",
		Company: "ESS TECHNOLOGY INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ECC",
		Company: "ESSENTIAL COMM. CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "ESB",
		Company: "ESTERLINE BELGIUM BVBA",
		Date:    "01/15/2015",
	},
	{
		ID:      "ESL",
		Company: "ESTERLINE TECHNOLOGIES",
		Date:    "01/06/2012",
	},
	{
		ID:      "EEE",
		Company: "ET&T TECHNOLOGY COMPANY LTD",
		Date:    "05/04/1998",
	},
	{
		ID:      "ETK",
		Company: "ETEK LABS INC.",
		Date:    "07/16/1998",
	},
	{
		ID:      "ETH",
		Company: "ETHERBOOT PROJECT",
		Date:    "07/09/2010",
	},
	{
		ID:      "ECK",
		Company: "EUGENE CHUKHLOMIN SOLE PROPRIETORSHIP, D.B.A.",
		Date:    "05/03/2008",
	},
	{
		ID:      "ERP",
		Company: "EURAPLAN GMBH",
		Date:    "11/29/1996",
	},
	{
		ID:      "EAS",
		Company: "EVANS AND SUTHERLAND COMPUTER",
		Date:    "01/28/2003",
	},
	{
		ID:      "EVX",
		Company: "EVEREX",
		Date:    "11/29/1996",
	},
	{
		ID:      "ETC",
		Company: "EVERTON TECHNOLOGY COMPANY LTD",
		Date:    "04/10/1997",
	},
	{
		ID:      "ETL",
		Company: "EVERTZ MICROSYSTEMS LTD.",
		Date:    "06/14/2007",
	},
	{
		ID:      "EVI",
		Company: "EVIATEG GMBH",
		Date:    "02/21/2000",
	},
	{
		ID:      "EMI",
		Company: "EX MACHINA INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "EXA",
		Company: "EXABYTE",
		Date:    "11/29/1996",
	},
	{
		ID:      "YHW",
		Company: "EXACOM SA",
		Date:    "11/29/1996",
	},
	{
		ID:      "EXT",
		Company: "EXATECH COMPUTADORES & SERVICOS LTDA",
		Date:    "09/23/1998",
	},
	{
		ID:      "ECL",
		Company: "EXCEL COMPANY LTD",
		Date:    "05/27/1997",
	},
	{
		ID:      "EXC",
		Company: "EXCESSION AUDIO",
		Date:    "11/06/1998",
	},
	{
		ID:      "XFO",
		Company: "EXFO ELECTRO OPTICAL ENGINEERING",
		Date:    "04/29/1998",
	},
	{
		ID:      "EXI",
		Company: "EXIDE ELECTRONICS",
		Date:    "11/29/1996",
	},
	{
		ID:      "EXR",
		Company: "EXPLORER INC.",
		Date:    "11/18/2015",
	},
	{
		ID:      "ELU",
		Company: "EXPRESS INDUSTRIAL, LTD.",
		Date:    "09/10/2015",
	},
	{
		ID:      "ELD",
		Company: "EXPRESS LUCK, INC.",
		Date:    "10/22/2019",
	},
	{
		ID:      "ESI",
		Company: "EXTENDED SYSTEMS, INC.",
		Date:    "07/16/1999",
	},
	{
		ID:      "EXY",
		Company: "EXTERITY LTD",
		Date:    "02/12/2009",
	},
	{
		ID:      "CRO",
		Company: "EXTRAORDINARY TECHNOLOGIES PTY LIMITED",
		Date:    "04/11/2005",
	},
	{
		ID:      "XES",
		Company: "EXTREME ENGINEERING SOLUTIONS, INC.",
		Date:    "06/22/2017",
	},
	{
		ID:      "EXX",
		Company: "EXXACT GMBH",
		Date:    "11/29/1996",
	},
	{
		ID:      "EYF",
		Company: "EYEFACTIVE GMBH",
		Date:    "07/07/2015",
	},
	{
		ID:      "EYE",
		Company: "EYEVIS GMBH",
		Date:    "11/18/2011",
	},
	{
		ID:      "EZE",
		Company: "EZE TECHNOLOGIES",
		Date:    "02/21/2005",
	},
	{
		ID:      "FJT",
		Company: "F.J. TIEMAN BV",
		Date:    "06/25/1998",
	},
	{
		ID:      "FFI",
		Company: "FAIRFIELD INDUSTRIES",
		Date:    "11/29/1996",
	},
	{
		ID:      "FAN",
		Company: "FANTALOOKS CO., LTD.",
		Date:    "03/12/2014",
	},
	{
		ID:      "FNC",
		Company: "FANUC LTD",
		Date:    "01/29/1997",
	},
	{
		ID:      "FAR",
		Company: "FARALLON COMPUTING",
		Date:    "11/29/1996",
	},
	{
		ID:      "FRO",
		Company: "FARO TECHNOLOGIES",
		Date:    "09/21/2012",
	},
	{
		ID:      "FLI",
		Company: "FAROUDJA LABORATORIES",
		Date:    "06/02/2004",
	},
	{
		ID:      "FMA",
		Company: "FAST MULTIMEDIA AG",
		Date:    "11/29/1996",
	},
	{
		ID:      "FTI",
		Company: "FASTPOINT TECHNOLOGIES, INC.",
		Date:    "06/21/2001",
	},
	{
		ID:      "FIT",
		Company: "FEATURE INTEGRATION TECHNOLOGY INC.",
		Date:    "08/11/2009",
	},
	{
		ID:      "FEL",
		Company: "FELLOWES & QUESTEC",
		Date:    "11/29/1996",
	},
	{
		ID:      "FMI",
		Company: "FELLOWES, INC.",
		Date:    "07/05/2001",
	},
	{
		ID:      "FEN",
		Company: "FEN SYSTEMS LTD.",
		Date:    "05/04/2010",
	},
	{
		ID:      "FER",
		Company: "FERRANTI INT'L",
		Date:    "11/29/1996",
	},
	{
		ID:      "TLA",
		Company: "FERRARI ELECTRONIC GMBH",
		Date:    "12/04/1996",
	},
	{
		ID:      "FHL",
		Company: "FHLP",
		Date:    "11/29/1996",
	},
	{
		ID:      "FRI",
		Company: "FIBERNET RESEARCH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "FDX",
		Company: "FINDEX, INC.",
		Date:    "10/22/2019",
	},
	{
		ID:      "FIN",
		Company: "FINECOM CO., LTD.",
		Date:    "11/27/1998",
	},
	{
		ID:      "FPC",
		Company: "FINGERPRINT CARDS AB",
		Date:    "06/14/2013",
	},
	{
		ID:      "PCG",
		Company: "FIRST INDUSTRIAL COMPUTER INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "LEO",
		Company: "FIRST INTERNATIONAL COMPUTER INC",
		Date:    "09/19/1997",
	},
	{
		ID:      "FCG",
		Company: "FIRST INTERNATIONAL COMPUTER LTD",
		Date:    "04/10/1997",
	},
	{
		ID:      "FVC",
		Company: "FIRST VIRTUAL CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "FWR",
		Company: "FLAT CONNECTIONS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "SSD",
		Company: "FLIGHTSAFETY INTERNATIONAL",
		Date:    "08/10/2000",
	},
	{
		ID:      "FIS",
		Company: "FLY-IT SIMULATORS",
		Date:    "09/08/1997",
	},
	{
		ID:      "FTS",
		Company: "FOCALTECH SYSTEMS CO., LTD.",
		Date:    "07/23/2013",
	},
	{
		ID:      "FCS",
		Company: "FOCUS ENHANCEMENTS, INC.",
		Date:    "12/12/2002",
	},
	{
		ID:      "FOK",
		Company: "FOKUS TECHNOLOGIES GMBH",
		Date:    "10/22/2013",
	},
	{
		ID:      "FOA",
		Company: "FOR-A COMPANY LIMITED",
		Date:    "12/06/2008",
	},
	{
		ID:      "FRC",
		Company: "FORCE COMPUTERS",
		Date:    "11/29/1996",
	},
	{
		ID:      "FMC",
		Company: "FORD MICROELECTRONICS INC",
		Date:    "03/11/1997",
	},
	{
		ID:      "FSI",
		Company: "FORE SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "FIL",
		Company: "FOREFRONT INT'L LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "FIC",
		Company: "FORMOSA INDUSTRIAL COMPUTING INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "FMZ",
		Company: "FORMOZA-ALTAIR",
		Date:    "04/25/2003",
	},
	{
		ID:      "FDD",
		Company: "FORTH DIMENSION DISPLAYS LTD",
		Date:    "07/07/2015",
	},
	{
		ID:      "FRE",
		Company: "FORVUS RESEARCH INC",
		Date:    "04/24/1997",
	},
	{
		ID:      "FOS",
		Company: "FOSS TECATOR",
		Date:    "10/22/1997",
	},
	{
		ID:      "FZC",
		Company: "FOUNDER GROUP SHENZHEN CO.",
		Date:    "11/08/1999",
	},
	{
		ID:      "FTN",
		Company: "FOUNTAIN TECHNOLOGIES INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "FOV",
		Company: "FOVE INC",
		Date:    "07/01/2016",
	},
	{
		ID:      "HHI",
		Company: "FRAUNHOFER HEINRICH-HERTZ-INSTITUTE",
		Date:    "07/27/2012",
	},
	{
		ID:      "FRD",
		Company: "FREEDOM SCIENTIFIC BLV",
		Date:    "06/15/2007",
	},
	{
		ID:      "TCX",
		Company: "FREEMARS HEAVY INDUSTRIES",
		Date:    "03/15/2001",
	},
	{
		ID:      "FTE",
		Company: "FRONTLINE TEST EQUIPMENT INC.",
		Date:    "01/20/1999",
	},
	{
		ID:      "FTG",
		Company: "FTG DATA SYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "FXX",
		Company: "FUJI XEROX",
		Date:    "11/29/1996",
	},
	{
		ID:      "FFC",
		Company: "FUJIFILM CORPORATION",
		Date:    "08/22/2011",
	},
	{
		ID:      "FDT",
		Company: "FUJITSU DISPLAY TECHNOLOGIES CORP.",
		Date:    "10/23/2002",
	},
	{
		ID:      "FGL",
		Company: "FUJITSU GENERAL LIMITED.",
		Date:    "02/21/2000",
	},
	{
		ID:      "FUJ",
		Company: "FUJITSU LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "FML",
		Company: "FUJITSU MICROELECT LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "FPE",
		Company: "FUJITSU PERIPHERALS LTD",
		Date:    "08/19/1997",
	},
	{
		ID:      "FUS",
		Company: "FUJITSU SIEMENS COMPUTERS GMBH",
		Date:    "01/13/2000",
	},
	{
		ID:      "FJS",
		Company: "FUJITSU SPAIN",
		Date:    "11/29/1996",
	},
	{
		ID:      "FJC",
		Company: "FUJITSU TAKAMISAWA COMPONENT LIMITED",
		Date:    "05/16/1999",
	},
	{
		ID:      "FTL",
		Company: "FUJITSU TEN LIMITED",
		Date:    "12/20/2011",
	},
	{
		ID:      "FNI",
		Company: "FUNAI ELECTRIC CO., LTD.",
		Date:    "01/18/2005",
	},
	{
		ID:      "FCB",
		Company: "FURUKAWA ELECTRIC COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "FEC",
		Company: "FURUNO ELECTRIC CO., LTD.",
		Date:    "11/29/1996",
	},
	{
		ID:      "FDI",
		Company: "FUTURE DESIGNS, INC.",
		Date:    "09/29/2014",
	},
	{
		ID:      "FDC",
		Company: "FUTURE DOMAIN",
		Date:    "11/29/1996",
	},
	{
		ID:      "FSC",
		Company: "FUTURE SYSTEMS CONSULTING KK",
		Date:    "11/29/1996",
	},
	{
		ID:      "FTC",
		Company: "FUTURETOUCH CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "FZI",
		Company: "FZI FORSCHUNGSZENTRUM INFORMATIK",
		Date:    "08/12/1997",
	},
	{
		ID:      "SPH",
		Company: "G&W INSTRUMENTS GMBH",
		Date:    "02/25/2002",
	},
	{
		ID:      "GTK",
		Company: "G-TECH CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "GDI",
		Company: "G. DIEHL ISDN GMBH",
		Date:    "11/29/1996",
	},
	{
		ID:      "GGT",
		Company: "G2TOUCH KOREA",
		Date:    "05/25/2017",
	},
	{
		ID:      "GLS",
		Company: "GADGET LABS LLC",
		Date:    "11/29/1996",
	},
	{
		ID:      "GAG",
		Company: "GAGE APPLIED SCIENCES INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "HUB",
		Company: "GAI-TRONICS, A HUBBELL COMPANY",
		Date:    "03/26/2009",
	},
	{
		ID:      "GAL",
		Company: "GALIL MOTION CONTROL",
		Date:    "11/29/1996",
	},
	{
		ID:      "GRM",
		Company: "GARMIN INTERNATIONAL",
		Date:    "12/09/2011",
	},
	{
		ID:      "GTM",
		Company: "GARNET SYSTEM COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "GWY",
		Company: "GATEWAY 2000",
		Date:    "11/29/1996",
	},
	{
		ID:      "GCI",
		Company: "GATEWAY COMM. INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "GWK",
		Company: "GATEWORKS CORPORATION",
		Date:    "07/31/2013",
	},
	{
		ID:      "GAU",
		Company: "GAUDI CO., LTD.",
		Date:    "03/31/2003",
	},
	{
		ID:      "GCC",
		Company: "GCC TECHNOLOGIES INC",
		Date:    "06/05/1997",
	},
	{
		ID:      "GDS",
		Company: "GDS",
		Date:    "06/23/2004",
	},
	{
		ID:      "GEF",
		Company: "GE FANUC EMBEDDED SYSTEMS",
		Date:    "06/14/2007",
	},
	{
		ID:      "GEC",
		Company: "GECHIC CORPORATION",
		Date:    "01/04/2016",
	},
	{
		ID:      "GFN",
		Company: "GEFEN INC.",
		Date:    "10/11/2007",
	},
	{
		ID:      "GEM",
		Company: "GEM PLUS",
		Date:    "02/27/1998",
	},
	{
		ID:      "GMN",
		Company: "GEMINI 2000 LTD",
		Date:    "10/23/2000",
	},
	{
		ID:      "GDC",
		Company: "GENERAL DATACOM",
		Date:    "11/29/1996",
	},
	{
		ID:      "GED",
		Company: "GENERAL DYNAMICS C4 SYSTEMS",
		Date:    "01/09/2013",
	},
	{
		ID:      "GML",
		Company: "GENERAL INFORMATION SYSTEMS",
		Date:    "01/13/2000",
	},
	{
		ID:      "GIC",
		Company: "GENERAL INST. CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "GSC",
		Company: "GENERAL STANDARDS CORPORATION",
		Date:    "07/16/1998",
	},
	{
		ID:      "GTT",
		Company: "GENERAL TOUCH TECHNOLOGY CO., LTD.",
		Date:    "11/21/2002",
	},
	{
		ID:      "GEN",
		Company: "GENESYS ATE INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "GLM",
		Company: "GENESYS LOGIC",
		Date:    "11/08/1999",
	},
	{
		ID:      "GND",
		Company: "GENNUM CORPORATION",
		Date:    "09/05/2006",
	},
	{
		ID:      "GEO",
		Company: "GEO SENSE",
		Date:    "11/29/1996",
	},
	{
		ID:      "GTS",
		Company: "GEOTEST MARVIN TEST SYSTEMS INC",
		Date:    "02/24/1998",
	},
	{
		ID:      "GER",
		Company: "GERMANEERS GMBH",
		Date:    "12/20/2011",
	},
	{
		ID:      "GES",
		Company: "GES SINGAPORE PTE LTD",
		Date:    "03/15/2001",
	},
	{
		ID:      "GET",
		Company: "GETAC TECHNOLOGY CORPORATION",
		Date:    "05/11/2010",
	},
	{
		ID:      "GFM",
		Company: "GFMESSTECHNIK GMBH",
		Date:    "03/15/2001",
	},
	{
		ID:      "GIP",
		Company: "GI PROVISION LTD",
		Date:    "02/08/2012",
	},
	{
		ID:      "GBT",
		Company: "GIGA-BYTE TECHNOLOGY CO., LTD.",
		Date:    "09/05/2018",
	},
	{
		ID:      "PST",
		Company: "GLOBAL DATA SA",
		Date:    "11/29/1996",
	},
	{
		ID:      "GVL",
		Company: "GLOBAL VILLAGE COMMUNICATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "GMK",
		Company: "GMK ELECTRONIC DESIGN GMBH",
		Date:    "01/18/2008",
	},
	{
		ID:      "GMM",
		Company: "GMM RESEARCH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "GMX",
		Company: "GMX INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "GNN",
		Company: "GN NETTEST INC",
		Date:    "07/30/1997",
	},
	{
		ID:      "GOE",
		Company: "GOEPEL ELECTRONIC GMBH",
		Date:    "06/24/2013",
	},
	{
		ID:      "GRE",
		Company: "GOLD RAIN ENTERPRISES CORP.",
		Date:    "06/04/2003",
	},
	{
		ID:      "GLD",
		Company: "GOLDMUND - DIGITAL AUDIO SA",
		Date:    "02/06/2012",
	},
	{
		ID:      "GSM",
		Company: "GOLDSTAR COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "GTI",
		Company: "GOLDTOUCH",
		Date:    "08/06/1997",
	},
	{
		ID:      "GGL",
		Company: "GOOGLE INC.",
		Date:    "05/26/2010",
	},
	{
		ID:      "GPR",
		Company: "GOPRO, INC.",
		Date:    "01/15/2015",
	},
	{
		ID:      "GRH",
		Company: "GRANCH LTD",
		Date:    "09/23/2002",
	},
	{
		ID:      "GJN",
		Company: "GRAND JUNCTION NETWORKS",
		Date:    "11/29/1996",
	},
	{
		ID:      "GSN",
		Company: "GRANDSTREAM NETWORKS, INC.",
		Date:    "03/03/2014",
	},
	{
		ID:      "GST",
		Company: "GRAPHIC SYSTEMTECHNOLOGY",
		Date:    "11/29/1996",
	},
	{
		ID:      "GRA",
		Company: "GRAPHICA COMPUTER",
		Date:    "11/29/1996",
	},
	{
		ID:      "GTC",
		Company: "GRAPHTEC CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "TGV",
		Company: "GRASS VALLEY GERMANY GMBH",
		Date:    "06/14/2007",
	},
	{
		ID:      "GAC",
		Company: "GREENARRAYS, INC.",
		Date:    "11/18/2015",
	},
	{
		ID:      "GCS",
		Company: "GREY CELL SYSTEMS LTD",
		Date:    "04/29/1997",
	},
	{
		ID:      "GSY",
		Company: "GROSSENBACHER SYSTEME AG",
		Date:    "04/19/2000",
	},
	{
		ID:      "SWO",
		Company: "GUANGZHOU SHIRUI ELECTRONICS CO., LTD.",
		Date:    "10/16/2015",
	},
	{
		ID:      "SKM",
		Company: "GUANGZHOU TECLAST INFORMATION TECHNOLOGY LIMITED",
		Date:    "11/18/2015",
	},
	{
		ID:      "GIM",
		Company: "GUILLEMONT INTERNATIONAL",
		Date:    "10/29/1997",
	},
	{
		ID:      "GUD",
		Company: "GUNTERMANN & DRUNCK GMBH",
		Date:    "03/10/2003",
	},
	{
		ID:      "GZE",
		Company: "GUNZE LIMITED",
		Date:    "05/02/2005",
	},
	{
		ID:      "GNZ",
		Company: "GUNZE LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "GUZ",
		Company: "GUZIK TECHNICAL ENTERPRISES",
		Date:    "11/29/1996",
	},
	{
		ID:      "GVC",
		Company: "GVC CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "GWI",
		Company: "GW INSTRUMENTS",
		Date:    "11/29/1996",
	},
	{
		ID:      "HPR",
		Company: "H.P.R. ELECTRONICS GMBH",
		Date:    "08/29/2007",
	},
	{
		ID:      "HSC",
		Company: "HAGIWARA SYS-COM COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "HAE",
		Company: "HAIDER ELECTRONICS",
		Date:    "07/05/2001",
	},
	{
		ID:      "HAI",
		Company: "HAIVISION SYSTEMS INC.",
		Date:    "11/15/2007",
	},
	{
		ID:      "HAL",
		Company: "HALBERTHAL",
		Date:    "02/10/1998",
	},
	{
		ID:      "HRI",
		Company: "HALL RESEARCH",
		Date:    "05/10/2012",
	},
	{
		ID:      "HPK",
		Company: "HAMAMATSU PHOTONICS K.K.",
		Date:    "12/20/2006",
	},
	{
		ID:      "HTI",
		Company: "HAMPSHIRE COMPANY, INC.",
		Date:    "01/20/1999",
	},
	{
		ID:      "HAN",
		Company: "HANCHANG SYSTEM CORPORATION",
		Date:    "06/21/2003",
	},
	{
		ID:      "ZMC",
		Company: "HANGZHOU ZMCHIVIN",
		Date:    "10/16/2015",
	},
	{
		ID:      "HSD",
		Company: "HANNSTAR DISPLAY CORP",
		Date:    "08/11/2009",
	},
	{
		ID:      "HSP",
		Company: "HANNSTAR DISPLAY CORP",
		Date:    "08/11/2009",
	},
	{
		ID:      "HDC",
		Company: "HARDCOM ELEKTRONIK & DATATEKNIK",
		Date:    "04/14/1998",
	},
	{
		ID:      "HII",
		Company: "HARMAN INTERNATIONAL INDUSTRIES, INC",
		Date:    "01/09/2015",
	},
	{
		ID:      "HJI",
		Company: "HARRIS & JEFFRIES INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "HWA",
		Company: "HARRIS CANADA INC",
		Date:    "03/13/1998",
	},
	{
		ID:      "HAR",
		Company: "HARRIS CORPORATION",
		Date:    "12/20/2011",
	},
	{
		ID:      "HRS",
		Company: "HARRIS SEMICONDUCTOR",
		Date:    "01/02/1997",
	},
	{
		ID:      "HCW",
		Company: "HAUPPAUGE COMPUTER WORKS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "HAY",
		Company: "HAYES MICROCOMPUTER PRODUCTS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "HCL",
		Company: "HCL AMERICA INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "HCM",
		Company: "HCL PERIPHERALS",
		Date:    "10/02/2001",
	},
	{
		ID:      "HDI",
		Company: "HD-INFO D.O.O.",
		Date:    "10/08/2001",
	},
	{
		ID:      "HPI",
		Company: "HEADPLAY, INC.",
		Date:    "04/30/2007",
	},
	{
		ID:      "HYT",
		Company: "HENG YU TECHNOLOGY (HK) LIMITED",
		Date:    "10/23/2000",
	},
	{
		ID:      "HRC",
		Company: "HERCULES",
		Date:    "03/15/2001",
	},
	{
		ID:      "HRT",
		Company: "HERCULES",
		Date:    "03/15/2001",
	},
	{
		ID:      "HRL",
		Company: "HEROLAB GMBH",
		Date:    "03/17/1998",
	},
	{
		ID:      "HET",
		Company: "HETEC DATENSYSTEME GMBH",
		Date:    "02/03/2004",
	},
	{
		ID:      "HWP",
		Company: "HEWLETT PACKARD",
		Date:    "03/15/2001",
	},
	{
		ID:      "HPD",
		Company: "HEWLETT PACKARD",
		Date:    "05/02/1997",
	},
	{
		ID:      "HPE",
		Company: "HEWLETT PACKARD ENTERPRISE",
		Date:    "09/22/2015",
	},
	{
		ID:      "HPC",
		Company: "HEWLETT-PACKARD CO.",
		Date:    "08/10/2000",
	},
	{
		ID:      "HPQ",
		Company: "HEWLETT-PACKARD CO.",
		Date:    "07/12/2004",
	},
	{
		ID:      "HXM",
		Company: "HEXIUM LTD.",
		Date:    "04/15/2008",
	},
	{
		ID:      "HIB",
		Company: "HIBINO CORPORATION",
		Date:    "07/09/2003",
	},
	{
		ID:      "HWD",
		Company: "HIGHWATER DESIGNS LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "HIK",
		Company: "HIKOM CO., LTD.",
		Date:    "10/13/2003",
	},
	{
		ID:      "HIL",
		Company: "HILEVEL TECHNOLOGY",
		Date:    "11/29/1996",
	},
	{
		ID:      "HHC",
		Company: "HIRAKAWA HEWTECH CORP.",
		Date:    "05/20/2008",
	},
	{
		ID:      "HEC",
		Company: "HISENSE ELECTRIC CO., LTD.",
		Date:    "01/01/1994",
	},
	{
		ID:      "HIT",
		Company: "HITACHI AMERICA LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "HCP",
		Company: "HITACHI COMPUTER PRODUCTS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "HCE",
		Company: "HITACHI CONSUMER ELECTRONICS CO., LTD",
		Date:    "05/15/2009",
	},
	{
		ID:      "HIC",
		Company: "HITACHI INFORMATION TECHNOLOGY CO., LTD.",
		Date:    "04/19/2000",
	},
	{
		ID:      "HTC",
		Company: "HITACHI LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "MXL",
		Company: "HITACHI MAXELL, LTD.",
		Date:    "01/13/2000",
	},
	{
		ID:      "HEL",
		Company: "HITACHI MICRO SYSTEMS EUROPE LTD",
		Date:    "07/09/1997",
	},
	{
		ID:      "HTX",
		Company: "HITEX SYSTEMENTWICKLUNG GMBH",
		Date:    "01/30/1998",
	},
	{
		ID:      "HKC",
		Company: "HKC OVERSEAS LIMITED",
		Date:    "03/30/2016",
	},
	{
		ID:      "HMK",
		Company: "HMK DATEN-SYSTEM-TECHNIK BMBH",
		Date:    "09/30/1997",
	},
	{
		ID:      "HOB",
		Company: "HOB ELECTRONIC GMBH",
		Date:    "11/29/1996",
	},
	{
		ID:      "HUK",
		Company: "HOFFMANN + KRIPPNER GMBH",
		Date:    "07/01/2016",
	},
	{
		ID:      "HOL",
		Company: "HOLOEYE PHOTONICS AG",
		Date:    "02/02/2005",
	},
	{
		ID:      "HDV",
		Company: "HOLOGRAFIKA KFT.",
		Date:    "03/31/2005",
	},
	{
		ID:      "HTK",
		Company: "HOLTEK MICROELECTRONICS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "INC",
		Company: "HOME ROW INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "FOX",
		Company: "HON HAI PRECISON IND.CO.,LTD.",
		Date:    "08/02/2010",
	},
	{
		ID:      "HKA",
		Company: "HONKO MFG. CO., LTD.",
		Date:    "12/01/2004",
	},
	{
		ID:      "HIS",
		Company: "HOPE INDUSTRIAL SYSTEMS, INC.",
		Date:    "01/13/2014",
	},
	{
		ID:      "APG",
		Company: "HORNER ELECTRIC INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "HST",
		Company: "HORSENT TECHNOLOGY CO., LTD.",
		Date:    "04/11/2015",
	},
	{
		ID:      "HOE",
		Company: "HOSIDEN CORPORATION",
		Date:    "08/05/1997",
	},
	{
		ID:      "PNT",
		Company: "HOYA CORPORATION PENTAX LIFECARE DIVISION",
		Date:    "05/25/2017",
	},
	{
		ID:      "HPN",
		Company: "HP INC.",
		Date:    "12/21/2015",
	},
	{
		ID:      "HTL",
		Company: "HTBLUVA MÖDLING",
		Date:    "02/17/2014",
	},
	{
		ID:      "HVR",
		Company: "HTC CORPORTATION",
		Date:    "10/16/2015",
	},
	{
		ID:      "HMC",
		Company: "HUALON MICROELECTRIC CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "EBT",
		Company: "HUALONG TECHNOLOGY CO., LTD",
		Date:    "06/15/2007",
	},
	{
		ID:      "HWV",
		Company: "HUAWEI TECHNOLOGIES CO., INC.",
		Date:    "04/25/2018",
	},
	{
		ID:      "HNS",
		Company: "HUGHES NETWORK SYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "HMX",
		Company: "HUMAX CO., LTD.",
		Date:    "02/14/2006",
	},
	{
		ID:      "HYO",
		Company: "HYC CO., LTD.",
		Date:    "04/12/2006",
	},
	{
		ID:      "HYD",
		Company: "HYDIS TECHNOLOGIES.CO.,LTD",
		Date:    "11/22/2010",
	},
	{
		ID:      "HYV",
		Company: "HYNIX SEMICONDUCTOR",
		Date:    "11/29/2008",
	},
	{
		ID:      "HYC",
		Company: "HYPERCOPE GMBH AACHEN",
		Date:    "12/01/1997",
	},
	{
		ID:      "HYR",
		Company: "HYPERTEC PTY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "HYP",
		Company: "HYPHEN LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "ITT",
		Company: "I&T TELECOM.",
		Date:    "11/08/1999",
	},
	{
		ID:      "IOD",
		Company: "I-O DATA DEVICE INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "IOS",
		Company: "I-O DISPLAY SYSTEM",
		Date:    "03/15/2001",
	},
	{
		ID:      "IOT",
		Company: "I/OTECH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "IAD",
		Company: "IADEA CORPORATION",
		Date:    "09/10/2015",
	},
	{
		ID:      "IAT",
		Company: "IAT GERMANY GMBH",
		Date:    "11/29/1996",
	},
	{
		ID:      "IBM",
		Company: "IBM BRASIL",
		Date:    "11/29/1996",
	},
	{
		ID:      "CDT",
		Company: "IBM CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "IBP",
		Company: "IBP INSTRUMENTS GMBH",
		Date:    "09/23/1998",
	},
	{
		ID:      "IBR",
		Company: "IBR GMBH",
		Date:    "01/16/1998",
	},
	{
		ID:      "ICE",
		Company: "IC ENSEMBLE",
		Date:    "09/19/1997",
	},
	{
		ID:      "ICA",
		Company: "ICA INC",
		Date:    "05/20/2002",
	},
	{
		ID:      "ICX",
		Company: "ICCC A/S",
		Date:    "11/29/1996",
	},
	{
		ID:      "ICD",
		Company: "ICD INC",
		Date:    "06/09/1997",
	},
	{
		ID:      "ARE",
		Company: "ICET S.P.A.",
		Date:    "05/16/1999",
	},
	{
		ID:      "ICP",
		Company: "ICP ELECTRONICS, INC./IEI TECHNOLOGY CORP.",
		Date:    "09/07/2012",
	},
	{
		ID:      "ICR",
		Company: "ICRON",
		Date:    "10/22/2019",
	},
	{
		ID:      "IUC",
		Company: "ICSL",
		Date:    "08/14/1997",
	},
	{
		ID:      "XTD",
		Company: "ICUITI CORPORATION",
		Date:    "06/14/2007",
	},
	{
		ID:      "IWR",
		Company: "ICUITI CORPORATION",
		Date:    "03/06/2007",
	},
	{
		ID:      "ISC",
		Company: "ID3 SEMICONDUCTORS",
		Date:    "03/15/2001",
	},
	{
		ID:      "IDE",
		Company: "IDE ASSOCIATES",
		Date:    "11/29/1996",
	},
	{
		ID:      "IDO",
		Company: "IDEO PRODUCT DEVELOPMENT",
		Date:    "09/30/1997",
	},
	{
		ID:      "DEX",
		Company: "IDEX DISPLAYS",
		Date:    "04/25/2002",
	},
	{
		ID:      "IDX",
		Company: "IDEXX LABS",
		Date:    "11/29/1996",
	},
	{
		ID:      "IDK",
		Company: "IDK CORPORATION",
		Date:    "04/16/2003",
	},
	{
		ID:      "IDN",
		Company: "IDNEO TECHNOLOGIES",
		Date:    "07/05/2012",
	},
	{
		ID:      "ITS",
		Company: "IDTECH",
		Date:    "06/17/2002",
	},
	{
		ID:      "IEE",
		Company: "IEE",
		Date:    "06/21/2001",
	},
	{
		ID:      "IGM",
		Company: "IGM COMMUNI",
		Date:    "11/29/1996",
	},
	{
		ID:      "IIN",
		Company: "IINFRA CO., LTD",
		Date:    "05/09/2003",
	},
	{
		ID:      "IVM",
		Company: "IIYAMA NORTH AMERICA",
		Date:    "11/29/1996",
	},
	{
		ID:      "IKE",
		Company: "IKEGAMI TSUSHINKI CO. LTD.",
		Date:    "11/14/2014",
	},
	{
		ID:      "IKS",
		Company: "IKOS SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "IND",
		Company: "ILC",
		Date:    "06/16/2004",
	},
	{
		ID:      "ILC",
		Company: "IMAGE LOGIC CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "ISM",
		Company: "IMAGE STREAM MEDICAL",
		Date:    "05/27/2010",
	},
	{
		ID:      "IMG",
		Company: "IMAGENICS CO., LTD.",
		Date:    "09/05/2006",
	},
	{
		ID:      "IQT",
		Company: "IMAGEQUEST CO., LTD",
		Date:    "10/08/2002",
	},
	{
		ID:      "IME",
		Company: "IMAGRAPH",
		Date:    "12/04/1996",
	},
	{
		ID:      "IMA",
		Company: "IMAGRAPH",
		Date:    "11/29/1996",
	},
	{
		ID:      "IMD",
		Company: "IMASDE CANARIAS S.A.",
		Date:    "07/03/1997",
	},
	{
		ID:      "IMC",
		Company: "IMC NETWORKS",
		Date:    "11/29/1996",
	},
	{
		ID:      "IMM",
		Company: "IMMERSION CORPORATION",
		Date:    "07/16/1997",
	},
	{
		ID:      "IMF",
		Company: "IMMERSIVE AUDIO TECHNOLOGIES FRANCE",
		Date:    "03/29/2018",
	},
	{
		ID:      "HUM",
		Company: "IMP ELECTRONICS LTD.",
		Date:    "06/16/2004",
	},
	{
		ID:      "IMP",
		Company: "IMPINJ",
		Date:    "08/14/2012",
	},
	{
		ID:      "IMN",
		Company: "IMPOSSIBLE PRODUCTION",
		Date:    "08/10/2000",
	},
	{
		ID:      "IFS",
		Company: "IN FOCUS SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ALD",
		Company: "IN4S INC",
		Date:    "12/05/1997",
	},
	{
		ID:      "IBI",
		Company: "INBINE.CO.LTD",
		Date:    "11/06/2001",
	},
	{
		ID:      "INK",
		Company: "INDTEK CO., LTD.",
		Date:    "03/26/2007",
	},
	{
		ID:      "IPD",
		Company: "INDUSTRIAL PRODUCTS DESIGN, INC.",
		Date:    "07/16/1999",
	},
	{
		ID:      "IQI",
		Company: "INEOQUEST TECHNOLOGIES, INC",
		Date:    "02/18/2011",
	},
	{
		ID:      "INS",
		Company: "INES GMBH",
		Date:    "11/29/1996",
	},
	{
		ID:      "IFX",
		Company: "INFINEON TECHNOLOGIES AG",
		Date:    "04/19/2000",
	},
	{
		ID:      "IFZ",
		Company: "INFINITE Z",
		Date:    "01/04/2012",
	},
	{
		ID:      "IIT",
		Company: "INFORMATIK INFORMATION TECHNOLOGIES",
		Date:    "08/14/2013",
	},
	{
		ID:      "IFT",
		Company: "INFORMTECH",
		Date:    "11/29/1996",
	},
	{
		ID:      "ICI",
		Company: "INFOTEK COMMUNICATION INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ITR",
		Company: "INFOTRONIC AMERICA, INC.",
		Date:    "06/21/2001",
	},
	{
		ID:      "INF",
		Company: "INFRAMETRICS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "VSN",
		Company: "INGRAM MACROTRON",
		Date:    "08/10/2000",
	},
	{
		ID:      "VID",
		Company: "INGRAM MACROTRON GERMANY",
		Date:    "05/24/2000",
	},
	{
		ID:      "IHE",
		Company: "INHAND ELECTRONICS",
		Date:    "04/20/2010",
	},
	{
		ID:      "INI",
		Company: "INITIO CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "IVR",
		Company: "INLIFE-HANDNET CO., LTD.",
		Date:    "01/19/2017",
	},
	{
		ID:      "IMT",
		Company: "INMAX TECHNOLOGY CORPORATION",
		Date:    "02/12/2003",
	},
	{
		ID:      "NES",
		Company: "INNES",
		Date:    "07/01/2016",
	},
	{
		ID:      "INO",
		Company: "INNOLAB PTE LTD",
		Date:    "01/20/1999",
	},
	{
		ID:      "INL",
		Company: "INNOLUX DISPLAY CORPORATION",
		Date:    "12/15/2004",
	},
	{
		ID:      "INM",
		Company: "INNOMEDIA INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ILS",
		Company: "INNOTECH CORPORATION",
		Date:    "10/23/2000",
	},
	{
		ID:      "ATE",
		Company: "INNOVATE LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "INN",
		Company: "INNOVENT SYSTEMS, INC.",
		Date:    "04/19/2000",
	},
	{
		ID:      "WII",
		Company: "INNOWARE INC",
		Date:    "01/30/1998",
	},
	{
		ID:      "inu",
		Company: "INOVATEC S.P.A.",
		Date:    "03/15/2001",
	},
	{
		ID:      "ICV",
		Company: "INSIDE CONTACTLESS",
		Date:    "11/04/2010",
	},
	{
		ID:      "ION",
		Company: "INSIDE OUT NETWORKS",
		Date:    "12/28/1998",
	},
	{
		ID:      "ISG",
		Company: "INSIGNIA SOLUTIONS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ISR",
		Company: "INSIS CO., LTD.",
		Date:    "02/12/2003",
	},
	{
		ID:      "IAF",
		Company: "INSTITUT F R ANGEWANDTE FUNKSYSTEMTECHNIK GMBH",
		Date:    "03/20/1999",
	},
	{
		ID:      "ING",
		Company: "INTEGRAPH CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "IBC",
		Company: "INTEGRATED BUSINESS SYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "ICS",
		Company: "INTEGRATED CIRCUIT SYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "IDP",
		Company: "INTEGRATED DEVICE TECHNOLOGY, INC.",
		Date:    "01/27/2010",
	},
	{
		ID:      "ITE",
		Company: "INTEGRATED TECH EXPRESS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "SRC",
		Company: "INTEGRATED TECH EXPRESS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ITX",
		Company: "INTEGRATED TECHNOLOGY EXPRESS INC",
		Date:    "06/25/1997",
	},
	{
		ID:      "IAI",
		Company: "INTEGRATION ASSOCIATES, INC.",
		Date:    "03/17/2004",
	},
	{
		ID:      "ICO",
		Company: "INTEL CORP",
		Date:    "08/10/2000",
	},
	{
		ID:      "III",
		Company: "INTELLIGENT INSTRUMENTATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "IPI",
		Company: "INTELLIGENT PLATFORM MANAGEMENT INTERFACE (IPMI) FORUM (INTEL, HP, NEC, DELL)",
		Date:    "05/24/2000",
	},
	{
		ID:      "IWX",
		Company: "INTELLIWORXX, INC.",
		Date:    "05/16/1999",
	},
	{
		ID:      "SVC",
		Company: "INTELLIX CORP.",
		Date:    "01/18/2008",
	},
	{
		ID:      "ITL",
		Company: "INTER-TEL",
		Date:    "03/21/1997",
	},
	{
		ID:      "TCH",
		Company: "INTERACTION SYSTEMS, INC",
		Date:    "03/20/1999",
	},
	{
		ID:      "PEN",
		Company: "INTERACTIVE COMPUTER PRODUCTS INC",
		Date:    "01/15/1997",
	},
	{
		ID:      "ITC",
		Company: "INTERCOM INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "IDS",
		Company: "INTERDIGITAL SISTEMAS DE INFORMACAO",
		Date:    "10/28/1997",
	},
	{
		ID:      "FBI",
		Company: "INTERFACE CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "ISI",
		Company: "INTERFACE SOLUTIONS",
		Date:    "11/29/1996",
	},
	{
		ID:      "IGC",
		Company: "INTERGATE PTY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "IEC",
		Company: "INTERLACE ENGINEERING CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "IEI",
		Company: "INTERLINK ELECTRONICS",
		Date:    "10/16/1998",
	},
	{
		ID:      "IDC",
		Company: "INTERNATIONAL DATACASTING CORPORATION",
		Date:    "02/25/1997",
	},
	{
		ID:      "IDT",
		Company: "INTERNATIONAL DISPLAY TECHNOLOGY",
		Date:    "05/16/2002",
	},
	{
		ID:      "ISY",
		Company: "INTERNATIONAL INTEGRATED SYSTEMS,INC.(IISI)",
		Date:    "08/10/2000",
	},
	{
		ID:      "IMI",
		Company: "INTERNATIONAL MICROSYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "IPT",
		Company: "INTERNATIONAL POWER TECHNOLOGIES",
		Date:    "04/11/1997",
	},
	{
		ID:      "ITD",
		Company: "INTERNET TECHNOLOGY CORPORATION",
		Date:    "12/05/1997",
	},
	{
		ID:      "INP",
		Company: "INTERPHASE CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "INT",
		Company: "INTERPHASE CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "LSD",
		Company: "INTERSIL CORPORATION",
		Date:    "03/14/2012",
	},
	{
		ID:      "IST",
		Company: "INTERSOLVE TECHNOLOGIES",
		Date:    "03/20/1999",
	},
	{
		ID:      "IXD",
		Company: "INTERTEX DATA AB",
		Date:    "11/29/1996",
	},
	{
		ID:      "IVI",
		Company: "INTERVOICE INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "IVS",
		Company: "INTEVAC PHOTONICS INC.",
		Date:    "02/16/2011",
	},
	{
		ID:      "ICM",
		Company: "INTRACOM SA",
		Date:    "08/03/1998",
	},
	{
		ID:      "SDD",
		Company: "INTRADA-SDD LTD",
		Date:    "11/21/2007",
	},
	{
		ID:      "ISP",
		Company: "INTRESOURCE SYSTEMS PTE LTD",
		Date:    "08/27/1997",
	},
	{
		ID:      "SRG",
		Company: "INTUITIVE SURGICAL, INC.",
		Date:    "02/16/2006",
	},
	{
		ID:      "INA",
		Company: "INVENTEC CORPORATION",
		Date:    "09/13/2013",
	},
	{
		ID:      "INE",
		Company: "INVENTEC ELECTRONICS (M) SDN. BHD.",
		Date:    "07/21/1998",
	},
	{
		ID:      "INV",
		Company: "INVISO, INC.",
		Date:    "10/23/2000",
	},
	{
		ID:      "IOM",
		Company: "IOMEGA",
		Date:    "11/29/1996",
	},
	{
		ID:      "IPP",
		Company: "IP POWER TECHNOLOGIES GMBH",
		Date:    "12/06/2010",
	},
	{
		ID:      "IPQ",
		Company: "IP3 TECHNOLOGY LTD.",
		Date:    "11/11/2013",
	},
	{
		ID:      "IPC",
		Company: "IPC CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "IPM",
		Company: "IPM INDUSTRIA POLITECNICA MERIDIONALE SPA",
		Date:    "09/23/1998",
	},
	{
		ID:      "IPS",
		Company: "IPS, INC. (INTELLECTUAL PROPERTY SOLUTIONS, INC.)",
		Date:    "09/05/2001",
	},
	{
		ID:      "IPW",
		Company: "IPWIRELESS, INC",
		Date:    "03/15/2001",
	},
	{
		ID:      "IRD",
		Company: "IRDATA",
		Date:    "04/24/2001",
	},
	{
		ID:      "IIC",
		Company: "ISIC INNOSCAN INDUSTRIAL COMPUTERS A/S",
		Date:    "07/23/2003",
	},
	{
		ID:      "ISL",
		Company: "ISOLATION SYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "ISS",
		Company: "ISS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ITP",
		Company: "IT-PRO CONSULTING UND SYSTEMHAUS GMBH",
		Date:    "10/23/2000",
	},
	{
		ID:      "ITA",
		Company: "ITAUSA EXPORT NORTH AMERICA",
		Date:    "11/29/1996",
	},
	{
		ID:      "IPR",
		Company: "ITHACA PERIPHERALS",
		Date:    "07/01/1997",
	},
	{
		ID:      "ITK",
		Company: "ITK TELEKOMMUNIKATION AG",
		Date:    "11/29/1996",
	},
	{
		ID:      "ITM",
		Company: "ITM INC.",
		Date:    "04/24/2001",
	},
	{
		ID:      "JCE",
		Company: "JACE TECH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "JIC",
		Company: "JAEIK INFORMATION & COMMUNICATION CO., LTD.",
		Date:    "10/23/2000",
	},
	{
		ID:      "XFG",
		Company: "JAN STRAPKO - FOTO",
		Date:    "05/07/2001",
	},
	{
		ID:      "JUK",
		Company: "JANICH & KLASS COMPUTERTECHNIK GMBH",
		Date:    "10/08/2002",
	},
	{
		ID:      "JAS",
		Company: "JANZ AUTOMATIONSSYSTEME AG",
		Date:    "11/03/2009",
	},
	{
		ID:      "JAE",
		Company: "JAPAN AVIATION ELECTRONICS INDUSTRY, LIMITED",
		Date:    "03/15/2001",
	},
	{
		ID:      "JDL",
		Company: "JAPAN DIGITAL LABORATORY CO.,LTD.",
		Date:    "04/19/2000",
	},
	{
		ID:      "JDI",
		Company: "JAPAN DISPLAY INC.",
		Date:    "04/18/2013",
	},
	{
		ID:      "JEM",
		Company: "JAPAN E.M.SOLUTIONS CO., LTD.",
		Date:    "05/24/2018",
	},
	{
		ID:      "JAT",
		Company: "JATON CORPORATION",
		Date:    "09/24/1997",
	},
	{
		ID:      "JET",
		Company: "JET POWER TECHNOLOGY CO., LTD.",
		Date:    "03/15/2001",
	},
	{
		ID:      "JWY",
		Company: "JETWAY INFORMATION CO., LTD",
		Date:    "09/22/2003",
	},
	{
		ID:      "JTY",
		Company: "JETWAY SECURITY MICRO,INC",
		Date:    "11/11/2009",
	},
	{
		ID:      "JWL",
		Company: "JEWELL INSTRUMENTS, LLC",
		Date:    "06/21/2001",
	},
	{
		ID:      "SHI",
		Company: "JIANGSU SHINCO ELECTRONIC GROUP CO., LTD",
		Date:    "08/10/2004",
	},
	{
		ID:      "JFX",
		Company: "JONES FUTUREX INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "LTI",
		Company: "JONGSHINE TECH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "HKG",
		Company: "JOSEF HEIM KG",
		Date:    "11/29/1996",
	},
	{
		ID:      "JPC",
		Company: "JPC TECHNOLOGY LIMITED",
		Date:    "10/23/2000",
	},
	{
		ID:      "JSD",
		Company: "JS DIGITECH, INC",
		Date:    "10/23/2000",
	},
	{
		ID:      "JTS",
		Company: "JS MOTORSPORTS",
		Date:    "12/05/1997",
	},
	{
		ID:      "TPJ",
		Company: "JUNNILA",
		Date:    "03/15/2001",
	},
	{
		ID:      "JUP",
		Company: "JUPITER SYSTEMS",
		Date:    "09/05/2006",
	},
	{
		ID:      "JSI",
		Company: "JUPITER SYSTEMS, INC.",
		Date:    "06/14/2007",
	},
	{
		ID:      "JVC",
		Company: "JVC",
		Date:    "10/23/2000",
	},
	{
		ID:      "JKC",
		Company: "JVC KENWOOD CORPORATION",
		Date:    "03/08/2012",
	},
	{
		ID:      "JWS",
		Company: "JWSPENCER & CO.",
		Date:    "07/16/1999",
	},
	{
		ID:      "KTE",
		Company: "K-TECH",
		Date:    "03/31/2003",
	},
	{
		ID:      "KZN",
		Company: "K-ZONE INTERNATIONAL",
		Date:    "06/21/2001",
	},
	{
		ID:      "KZI",
		Company: "K-ZONE INTERNATIONAL CO. LTD.",
		Date:    "08/10/2000",
	},
	{
		ID:      "SGE",
		Company: "KANSAI ELECTRIC COMPANY LTD",
		Date:    "12/04/1996",
	},
	{
		ID:      "HIQ",
		Company: "KAOHSIUNG OPTO ELECTRONICS AMERICAS, INC.",
		Date:    "03/14/2012",
	},
	{
		ID:      "KSL",
		Company: "KARN SOLUTIONS LTD.",
		Date:    "05/08/2006",
	},
	{
		ID:      "KAR",
		Company: "KARNA",
		Date:    "02/21/2000",
	},
	{
		ID:      "KTN",
		Company: "KATRON TECH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "KTG",
		Company: "KAYSER-THREDE GMBH",
		Date:    "11/29/1996",
	},
	{
		ID:      "KDT",
		Company: "KDDI TECHNOLOGY CORPORATION",
		Date:    "05/22/2012",
	},
	{
		ID:      "KDE",
		Company: "KDE",
		Date:    "08/14/2001",
	},
	{
		ID:      "KDS",
		Company: "KDS USA",
		Date:    "11/29/1996",
	},
	{
		ID:      "KGL",
		Company: "KEISOKU GIKEN CO.,LTD.",
		Date:    "04/17/2012",
	},
	{
		ID:      "KML",
		Company: "KENSINGTON MICROWARE LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "KWD",
		Company: "KENWOOD CORPORATION",
		Date:    "02/22/2008",
	},
	{
		ID:      "EPS",
		Company: "KEPS",
		Date:    "11/29/1996",
	},
	{
		ID:      "KES",
		Company: "KESA CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "KEY",
		Company: "KEY TECH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "KTK",
		Company: "KEY TRONIC CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "KCL",
		Company: "KEYCORP LTD",
		Date:    "05/20/1997",
	},
	{
		ID:      "KYN",
		Company: "KEYENCE CORPORATION",
		Date:    "03/30/2016",
	},
	{
		ID:      "KVX",
		Company: "KEYVIEW",
		Date:    "08/13/2012",
	},
	{
		ID:      "KBI",
		Company: "KIDBOARD INC",
		Date:    "04/24/1997",
	},
	{
		ID:      "KME",
		Company: "KIMIN ELECTRONICS CO., LTD.",
		Date:    "02/15/2011",
	},
	{
		ID:      "KSC",
		Company: "KINETIC SYSTEMS CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "KPC",
		Company: "KING PHOENIX COMPANY",
		Date:    "11/29/1996",
	},
	{
		ID:      "KSX",
		Company: "KING TESTER CORPORATION",
		Date:    "07/16/1998",
	},
	{
		ID:      "KTC",
		Company: "KINGSTON TECH CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "KIO",
		Company: "KIONIX, INC.",
		Date:    "12/23/2013",
	},
	{
		ID:      "KIS",
		Company: "KISS TECHNOLOGY A/S",
		Date:    "06/16/2005",
	},
	{
		ID:      "KGI",
		Company: "KLIPSCH GROUP, INC",
		Date:    "09/22/2015",
	},
	{
		ID:      "PVP",
		Company: "KLOS TECHNOLOGIES, INC.",
		Date:    "08/10/2000",
	},
	{
		ID:      "KBL",
		Company: "KOBIL SYSTEMS GMBH",
		Date:    "03/15/2001",
	},
	{
		ID:      "KOB",
		Company: "KOBIL SYSTEMS GMBH",
		Date:    "03/15/2001",
	},
	{
		ID:      "KDK",
		Company: "KODIAK TECH",
		Date:    "11/29/1996",
	},
	{
		ID:      "KFX",
		Company: "KOFAX IMAGE PRODUCTS",
		Date:    "11/29/1996",
	},
	{
		ID:      "KOL",
		Company: "KOLLMORGEN MOTION TECHNOLOGIES GROUP",
		Date:    "11/29/1996",
	},
	{
		ID:      "KOE",
		Company: "KOLTER ELECTRONIC",
		Date:    "03/15/2001",
	},
	{
		ID:      "KFE",
		Company: "KOMATSU FOREST",
		Date:    "04/20/2010",
	},
	{
		ID:      "KNC",
		Company: "KONICA CORPORATION",
		Date:    "08/05/1997",
	},
	{
		ID:      "KTI",
		Company: "KONICA TECHNICAL INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "TWE",
		Company: "KONTRON ELECTRONIK",
		Date:    "11/29/1996",
	},
	{
		ID:      "KEM",
		Company: "KONTRON EMBEDDED MODULES GMBH",
		Date:    "08/29/2007",
	},
	{
		ID:      "KEU",
		Company: "KONTRON EUROPE GMBH",
		Date:    "02/20/2014",
	},
	{
		ID:      "KOM",
		Company: "KONTRON GMBH",
		Date:    "09/05/2018",
	},
	{
		ID:      "KDM",
		Company: "KOREA DATA SYSTEMS CO., LTD.",
		Date:    "12/18/2003",
	},
	{
		ID:      "KOU",
		Company: "KOUZIRO CO.,LTD.",
		Date:    "07/27/2012",
	},
	{
		ID:      "KOW",
		Company: "KOWA COMPANY,LTD.",
		Date:    "03/12/2008",
	},
	{
		ID:      "KMR",
		Company: "KRAMER ELECTRONICS LTD. INTERNATIONAL",
		Date:    "07/10/2013",
	},
	{
		ID:      "KRL",
		Company: "KRELL INDUSTRIES INC.",
		Date:    "08/03/2004",
	},
	{
		ID:      "KRM",
		Company: "KROMA TELECOM",
		Date:    "05/05/2010",
	},
	{
		ID:      "KRY",
		Company: "KROY LLC",
		Date:    "07/16/1998",
	},
	{
		ID:      "KSG",
		Company: "KUPA CHINA SHENZHEN MICRO TECHNOLOGY CO., LTD. GOLD INSTITUTE",
		Date:    "04/22/2014",
	},
	{
		ID:      "KUR",
		Company: "KURTA CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "KVA",
		Company: "KVASER AB",
		Date:    "01/24/1997",
	},
	{
		ID:      "KYE",
		Company: "KYE SYST CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "KYC",
		Company: "KYOCERA CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "KEC",
		Company: "KYUSHU ELECTRONICS SYSTEMS INC",
		Date:    "01/12/1998",
	},
	{
		ID:      "LLL",
		Company: "L-3 COMMUNICATIONS",
		Date:    "05/11/2010",
	},
	{
		ID:      "LCE",
		Company: "LA COMMANDE ELECTRONIQUE",
		Date:    "11/29/1996",
	},
	{
		ID:      "LCT",
		Company: "LABCAL TECHNOLOGIES",
		Date:    "11/08/1999",
	},
	{
		ID:      "LTC",
		Company: "LABTEC INC",
		Date:    "12/08/1997",
	},
	{
		ID:      "LWC",
		Company: "LABWAY CORPORATION",
		Date:    "12/04/1996",
	},
	{
		ID:      "LAC",
		Company: "LACIE",
		Date:    "12/28/1998",
	},
	{
		ID:      "LAG",
		Company: "LAGUNA SYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "LND",
		Company: "LAND COMPUTER COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "LNT",
		Company: "LANETCO INTERNATIONAL",
		Date:    "05/02/2003",
	},
	{
		ID:      "LWW",
		Company: "LANIER WORLDWIDE",
		Date:    "11/29/1996",
	},
	{
		ID:      "LHA",
		Company: "LARS HAAGH APS",
		Date:    "01/09/1997",
	},
	{
		ID:      "LAS",
		Company: "LASAT COMM. A/S",
		Date:    "11/29/1996",
	},
	{
		ID:      "LMT",
		Company: "LASER MASTER",
		Date:    "11/29/1996",
	},
	{
		ID:      "LDN",
		Company: "LASERDYNE TECHNOLOGIES",
		Date:    "10/16/2013",
	},
	{
		ID:      "LGX",
		Company: "LASERGRAPHICS, INC.",
		Date:    "02/21/2000",
	},
	{
		ID:      "LCM",
		Company: "LATITUDE COMM.",
		Date:    "11/29/1996",
	},
	{
		ID:      "LAV",
		Company: "LAVA COMPUTER MFG INC",
		Date:    "04/14/1997",
	},
	{
		ID:      "LCC",
		Company: "LCI",
		Date:    "08/10/2000",
	},
	{
		ID:      "LEC",
		Company: "LECTRON COMPANY LTD",
		Date:    "03/27/1997",
	},
	{
		ID:      "LMP",
		Company: "LEDA MEDIA PRODUCTS",
		Date:    "05/11/1998",
	},
	{
		ID:      "LEG",
		Company: "LEGERITY, INC",
		Date:    "01/18/2005",
	},
	{
		ID:      "LTV",
		Company: "LEITCH TECHNOLOGY INTERNATIONAL INC.",
		Date:    "12/09/2003",
	},
	{
		ID:      "LNV",
		Company: "LENOVO",
		Date:    "07/14/2005",
	},
	{
		ID:      "VLM",
		Company: "LENOVO BEIJING CO. LTD.",
		Date:    "05/21/2019",
	},
	{
		ID:      "LIN",
		Company: "LENOVO BEIJING CO. LTD.",
		Date:    "05/22/2012",
	},
	{
		ID:      "LEN",
		Company: "LENOVO GROUP LIMITED",
		Date:    "06/03/2005",
	},
	{
		ID:      "PRS",
		Company: "LEUTRON VISION",
		Date:    "11/29/1996",
	},
	{
		ID:      "LEX",
		Company: "LEXICAL LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "LCN",
		Company: "LEXICON",
		Date:    "03/01/2005",
	},
	{
		ID:      "LMI",
		Company: "LEXMARK INT'L INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "LGS",
		Company: "LG SEMICOM COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "MAN",
		Company: "LGIC",
		Date:    "02/21/2000",
	},
	{
		ID:      "LSC",
		Company: "LIFESIZE COMMUNICATIONS",
		Date:    "02/14/2006",
	},
	{
		ID:      "LHT",
		Company: "LIGHTHOUSE TECHNOLOGIES LIMITED",
		Date:    "05/04/2010",
	},
	{
		ID:      "LSP",
		Company: "LIGHTSPACE TECHNOLOGIES",
		Date:    "03/29/2018",
	},
	{
		ID:      "LWR",
		Company: "LIGHTWARE VISUAL ENGINEERING",
		Date:    "02/04/2009",
	},
	{
		ID:      "LTW",
		Company: "LIGHTWARE, INC",
		Date:    "10/16/1998",
	},
	{
		ID:      "LZX",
		Company: "LIGHTWELL COMPANY LTD",
		Date:    "12/02/1997",
	},
	{
		ID:      "LKM",
		Company: "LIKOM TECHNOLOGY SDN. BHD.",
		Date:    "04/23/1998",
	},
	{
		ID:      "LNR",
		Company: "LINEAR SYSTEMS LTD.",
		Date:    "10/11/2007",
	},
	{
		ID:      "LNK",
		Company: "LINK TECH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "LIP",
		Company: "LINKED IP GMBH",
		Date:    "07/19/2010",
	},
	{
		ID:      "FGD",
		Company: "LISA DRAEXLMAIER GMBH",
		Date:    "02/22/1999",
	},
	{
		ID:      "LCI",
		Company: "LITE-ON COMMUNICATION INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "LOL",
		Company: "LITELOGIC OPERATIONS LTD",
		Date:    "12/09/2011",
	},
	{
		ID:      "LIT",
		Company: "LITHICS SILICON TECHNOLOGY",
		Date:    "03/15/2001",
	},
	{
		ID:      "LTN",
		Company: "LITRONIC INC",
		Date:    "02/03/1998",
	},
	{
		ID:      "SKI",
		Company: "LLC SKTB “SKIT”",
		Date:    "10/22/2019",
	},
	{
		ID:      "LOC",
		Company: "LOCAMATION B.V.",
		Date:    "01/09/2004",
	},
	{
		ID:      "LOE",
		Company: "LOEWE OPTA GMBH",
		Date:    "05/02/2005",
	},
	{
		ID:      "LGC",
		Company: "LOGIC LTD",
		Date:    "04/02/1994",
	},
	{
		ID:      "LSL",
		Company: "LOGICAL SOLUTIONS",
		Date:    "11/29/1996",
	},
	{
		ID:      "LOG",
		Company: "LOGICODE TECHNOLOGY INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "LDT",
		Company: "LOGIDATATECH ELECTRONIC GMBH",
		Date:    "03/15/2001",
	},
	{
		ID:      "LGI",
		Company: "LOGITECH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "SGO",
		Company: "LOGOS DESIGN A/S",
		Date:    "04/24/2001",
	},
	{
		ID:      "LED",
		Company: "LONG ENGINEERING DESIGN INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "LCS",
		Company: "LONGSHINE ELECTRONICS COMPANY",
		Date:    "11/29/1996",
	},
	{
		ID:      "LSI",
		Company: "LOUGHBOROUGH SOUND IMAGES",
		Date:    "11/29/1996",
	},
	{
		ID:      "LSJ",
		Company: "LSI JAPAN COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "LSY",
		Company: "LSI SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "LTS",
		Company: "LTS SCALE LLC",
		Date:    "11/15/2007",
	},
	{
		ID:      "LBO",
		Company: "LUBOSOFT",
		Date:    "04/24/2001",
	},
	{
		ID:      "LUC",
		Company: "LUCENT TECHNOLOGIES",
		Date:    "04/19/2000",
	},
	{
		ID:      "LMG",
		Company: "LUCENT TECHNOLOGIES",
		Date:    "01/13/1997",
	},
	{
		ID:      "LTK",
		Company: "LUCIDITY TECHNOLOGY COMPANY LTD",
		Date:    "05/18/1998",
	},
	{
		ID:      "LUM",
		Company: "LUMAGEN, INC.",
		Date:    "08/12/2004",
	},
	{
		ID:      "LHE",
		Company: "LUNG HWA ELECTRONICS COMPANY LTD",
		Date:    "06/12/1998",
	},
	{
		ID:      "LXN",
		Company: "LUXEON",
		Date:    "03/15/2001",
	},
	{
		ID:      "LUX",
		Company: "LUXXELL RESEARCH INC",
		Date:    "06/09/1997",
	},
	{
		ID:      "LVI",
		Company: "LVI LOW VISION INTERNATIONAL AB",
		Date:    "01/21/2011",
	},
	{
		ID:      "LXC",
		Company: "LXCO TECHNOLOGIES AG",
		Date:    "01/11/2012",
	},
	{
		ID:      "MGL",
		Company: "M-G TECHNOLOGY LTD",
		Date:    "10/29/1997",
	},
	{
		ID:      "OHW",
		Company: "M-LABS LIMITED",
		Date:    "11/27/2013",
	},
	{
		ID:      "MPC",
		Company: "M-PACT INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "MSF",
		Company: "M-SYSTEMS FLASH DISK PIONEERS",
		Date:    "12/17/1997",
	},
	{
		ID:      "MAC",
		Company: "MAC SYSTEM COMPANY LTD",
		Date:    "09/26/1997",
	},
	{
		ID:      "MEJ",
		Company: "MAC-EIGHT CO., LTD.",
		Date:    "01/19/2011",
	},
	{
		ID:      "OCD",
		Company: "MACRAIGOR SYSTEMS INC",
		Date:    "03/23/1998",
	},
	{
		ID:      "VHI",
		Company: "MACROCAD DEVELOPMENT INC.",
		Date:    "04/19/2000",
	},
	{
		ID:      "MXI",
		Company: "MACRONIX INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "MDG",
		Company: "MADGE NETWORKS",
		Date:    "11/29/1996",
	},
	{
		ID:      "MAE",
		Company: "MAESTRO PTY LTD",
		Date:    "12/04/1996",
	},
	{
		ID:      "MAG",
		Company: "MAG INNOVISION",
		Date:    "11/29/1996",
	},
	{
		ID:      "MLP",
		Company: "MAGIC LEAP",
		Date:    "11/14/2014",
	},
	{
		ID:      "MCP",
		Company: "MAGNI SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "EKA",
		Company: "MAGTEK INC.",
		Date:    "02/14/2006",
	},
	{
		ID:      "MDT",
		Company: "MAGUS DATA TECH",
		Date:    "11/29/1996",
	},
	{
		ID:      "MPN",
		Company: "MAINPINE LIMITED",
		Date:    "06/30/2007",
	},
	{
		ID:      "MUK",
		Company: "MAINPINE LIMITED",
		Date:    "09/13/1999",
	},
	{
		ID:      "PAK",
		Company: "MANY CNC SYSTEM CO., LTD.",
		Date:    "03/12/2004",
	},
	{
		ID:      "MPL",
		Company: "MAPLE RESEARCH INST. COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "MJI",
		Company: "MARANTZ JAPAN, INC.",
		Date:    "10/23/2000",
	},
	{
		ID:      "MIL",
		Company: "MARCONI INSTRUMENTS LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "MRC",
		Company: "MARCONI SIMULATION & TY-COCH WAY TRAINING",
		Date:    "11/29/1996",
	},
	{
		ID:      "MCR",
		Company: "MARINA COMMUNICAITONS",
		Date:    "11/29/1996",
	},
	{
		ID:      "MLN",
		Company: "MARK LEVINSON",
		Date:    "02/28/2005",
	},
	{
		ID:      "MTU",
		Company: "MARK OF THE UNICORN INC",
		Date:    "03/21/1997",
	},
	{
		ID:      "MTC",
		Company: "MARS-TECH CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "MNI",
		Company: "MARSEILLE, INC.",
		Date:    "02/27/2013",
	},
	{
		ID:      "MBM",
		Company: "MARSHALL ELECTRONICS",
		Date:    "03/13/2006",
	},
	{
		ID:      "MRK",
		Company: "MARUKO & COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "MSR",
		Company: "MASPRO DENKOH CORP.",
		Date:    "10/25/2012",
	},
	{
		ID:      "MAS",
		Company: "MASS INC.",
		Date:    "02/25/2002",
	},
	{
		ID:      "MCQ",
		Company: "MAT'S COMPUTERS",
		Date:    "07/22/2004",
	},
	{
		ID:      "MEQ",
		Company: "MATELECT LTD.",
		Date:    "05/30/2002",
	},
	{
		ID:      "MOC",
		Company: "MATRIX ORBITAL CORPORATION",
		Date:    "11/13/2017",
	},
	{
		ID:      "MTX",
		Company: "MATROX",
		Date:    "11/29/1996",
	},
	{
		ID:      "WPA",
		Company: "MATSUSHITA COMMUNICATION INDUSTRIAL CO., LTD.",
		Date:    "03/15/2001",
	},
	{
		ID:      "MAT",
		Company: "MATSUSHITA ELECTRIC IND. COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "MTI",
		Company: "MAXCOM TECHNICAL INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "VOB",
		Company: "MAXDATA COMPUTER AG",
		Date:    "02/21/2000",
	},
	{
		ID:      "MXD",
		Company: "MAXDATA COMPUTER GMBH & CO.KG",
		Date:    "04/19/2000",
	},
	{
		ID:      "MXP",
		Company: "MAXPEED CORPORATION",
		Date:    "02/19/1997",
	},
	{
		ID:      "MXT",
		Company: "MAXTECH CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "MXV",
		Company: "MAXVISION CORPORATION",
		Date:    "07/16/1999",
	},
	{
		ID:      "DJP",
		Company: "MAYGAY MACHINES, LTD",
		Date:    "08/10/2000",
	},
	{
		ID:      "MAY",
		Company: "MAYNARD ELECTRONICS",
		Date:    "11/29/1996",
	},
	{
		ID:      "MAZ",
		Company: "MAZET GMBH",
		Date:    "08/11/1998",
	},
	{
		ID:      "MBC",
		Company: "MBC",
		Date:    "11/29/1996",
	},
	{
		ID:      "MCD",
		Company: "MCDATA CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "MLI",
		Company: "MCINTOSH LABORATORY INC.",
		Date:    "01/18/2008",
	},
	{
		ID:      "MIT",
		Company: "MCM INDUSTRIAL TECHNOLOGY GMBH",
		Date:    "10/29/2004",
	},
	{
		ID:      "CEM",
		Company: "MEC ELECTRONICS GMBH",
		Date:    "04/19/2000",
	},
	{
		ID:      "MDR",
		Company: "MEDAR INC",
		Date:    "12/11/1996",
	},
	{
		ID:      "MTB",
		Company: "MEDIA TECHNOLOGIES LTD.",
		Date:    "01/05/2009",
	},
	{
		ID:      "MKC",
		Company: "MEDIA TEK INC.",
		Date:    "06/14/2007",
	},
	{
		ID:      "MVI",
		Company: "MEDIA VISION INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "MDA",
		Company: "MEDIA4 INC",
		Date:    "03/20/1997",
	},
	{
		ID:      "OWL",
		Company: "MEDIACOM TECHNOLOGIES PTE LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "MEK",
		Company: "MEDIAEDGE CORPORATION",
		Date:    "11/19/2013",
	},
	{
		ID:      "MFR",
		Company: "MEDIAFIRE CORP.",
		Date:    "12/28/1998",
	},
	{
		ID:      "FTR",
		Company: "MEDIASONIC",
		Date:    "11/29/1996",
	},
	{
		ID:      "MTE",
		Company: "MEDIATEC GMBH",
		Date:    "12/13/1996",
	},
	{
		ID:      "MDK",
		Company: "MEDIATEK CORPORATION",
		Date:    "03/13/1997",
	},
	{
		ID:      "MPI",
		Company: "MEDIATRIX PERIPHERALS INC",
		Date:    "04/24/1997",
	},
	{
		ID:      "MVR",
		Company: "MEDICAPTURE, INC.",
		Date:    "05/25/2017",
	},
	{
		ID:      "MCJ",
		Company: "MEDICAROID CORPORATION",
		Date:    "08/20/2018",
	},
	{
		ID:      "MRO",
		Company: "MEDIKRO OY",
		Date:    "09/19/1997",
	},
	{
		ID:      "MEC",
		Company: "MEGA SYSTEM TECHNOLOGIES INC",
		Date:    "12/29/1997",
	},
	{
		ID:      "MGA",
		Company: "MEGA SYSTEM TECHNOLOGIES, INC.",
		Date:    "12/28/1998",
	},
	{
		ID:      "MPV",
		Company: "MEGAPIXEL VISUAL REALTY",
		Date:    "07/15/2020",
	},
	{
		ID:      "MSK",
		Company: "MEGASOFT INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "MGT",
		Company: "MEGATECH R & D COMPANY",
		Date:    "11/29/1996",
	},
	{
		ID:      "MEP",
		Company: "MELD TECHNOLOGY",
		Date:    "08/16/2012",
	},
	{
		ID:      "MEN",
		Company: "MEN MIKROELECTRONIK NUERUBERG GMBH",
		Date:    "05/23/1997",
	},
	{
		ID:      "MGC",
		Company: "MENTOR GRAPHICS CORPORATION",
		Date:    "07/30/2009",
	},
	{
		ID:      "RLD",
		Company: "MEPCO",
		Date:    "03/15/2001",
	},
	{
		ID:      "PPD",
		Company: "MEPHI",
		Date:    "11/27/1998",
	},
	{
		ID:      "MRT",
		Company: "MERGING TECHNOLOGIES",
		Date:    "11/29/1996",
	},
	{
		ID:      "MAL",
		Company: "MERIDIAN AUDIO LTD",
		Date:    "02/04/2009",
	},
	{
		ID:      "MED",
		Company: "MESSELTRONIK DRESDEN GMBH",
		Date:    "11/29/1996",
	},
	{
		ID:      "MDV",
		Company: "MET DEVELOPMENT INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "MVN",
		Company: "META COMPANY",
		Date:    "05/25/2016",
	},
	{
		ID:      "CFR",
		Company: "META VIEW, INC.",
		Date:    "07/15/2020",
	},
	{
		ID:      "MTA",
		Company: "META WATCH LTD",
		Date:    "08/29/2013",
	},
	{
		ID:      "MET",
		Company: "METHEUS CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "MCM",
		Company: "METRICOM INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "QCH",
		Company: "METRONICS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "NET",
		Company: "METTLER TOLEDO",
		Date:    "11/29/1996",
	},
	{
		ID:      "MCE",
		Company: "METZ-WERKE GMBH & CO KG",
		Date:    "06/30/2005",
	},
	{
		ID:      "MIC",
		Company: "MICOM COMMUNICATIONS INC",
		Date:    "05/05/1997",
	},
	{
		ID:      "MSX",
		Company: "MICOMSOFT CO., LTD.",
		Date:    "04/10/2008",
	},
	{
		ID:      "MCS",
		Company: "MICRO COMPUTER SYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "MDI",
		Company: "MICRO DESIGN INC",
		Date:    "01/20/1998",
	},
	{
		ID:      "MDS",
		Company: "MICRO DISPLAY SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "MFI",
		Company: "MICRO FIRMWARE",
		Date:    "12/30/1997",
	},
	{
		ID:      "MCC",
		Company: "MICRO INDUSTRIES",
		Date:    "04/21/2003",
	},
	{
		ID:      "BPD",
		Company: "MICRO SOLUTIONS, INC.",
		Date:    "04/19/2000",
	},
	{
		ID:      "MSA",
		Company: "MICRO SYSTEMATION AB",
		Date:    "11/08/1999",
	},
	{
		ID:      "JMT",
		Company: "MICRO TECHNICAL COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "MTH",
		Company: "MICRO-TECH HEARING INSTRUMENTS",
		Date:    "12/15/1997",
	},
	{
		ID:      "MBD",
		Company: "MICROBUS PLC",
		Date:    "08/13/2002",
	},
	{
		ID:      "MNP",
		Company: "MICROCOM",
		Date:    "11/29/1996",
	},
	{
		ID:      "MDX",
		Company: "MICRODATEC GMBH",
		Date:    "09/13/1999",
	},
	{
		ID:      "MRD",
		Company: "MICRODISPLAY CORPORATION",
		Date:    "06/14/2007",
	},
	{
		ID:      "MDY",
		Company: "MICRODYNE INC",
		Date:    "12/18/1996",
	},
	{
		ID:      "MFG",
		Company: "MICROFIELD GRAPHICS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "MIV",
		Company: "MICROIMAGE VIDEO SYSTEMS",
		Date:    "12/08/2015",
	},
	{
		ID:      "MPJ",
		Company: "MICROLAB",
		Date:    "05/23/1997",
	},
	{
		ID:      "LAF",
		Company: "MICROLINE",
		Date:    "09/13/1999",
	},
	{
		ID:      "MLG",
		Company: "MICROLOGICA AG",
		Date:    "10/06/1998",
	},
	{
		ID:      "MMD",
		Company: "MICROMED BIOTECNOLOGIA LTD",
		Date:    "12/11/1996",
	},
	{
		ID:      "MMA",
		Company: "MICROMEDIA AG",
		Date:    "04/24/1997",
	},
	{
		ID:      "MCN",
		Company: "MICRON ELECTRONICS INC",
		Date:    "02/20/1997",
	},
	{
		ID:      "MCI",
		Company: "MICRONICS COMPUTERS",
		Date:    "11/29/1996",
	},
	{
		ID:      "MIP",
		Company: "MICRONPC.COM",
		Date:    "08/10/2000",
	},
	{
		ID:      "MYX",
		Company: "MICRONYX INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "MPX",
		Company: "MICROPIX TECHNOLOGIES, LTD.",
		Date:    "10/08/2001",
	},
	{
		ID:      "MSL",
		Company: "MICROSLATE INC.",
		Date:    "05/16/1999",
	},
	{
		ID:      "PNP",
		Company: "MICROSOFT",
		Date:    "03/05/2004",
	},
	{
		ID:      "MSH",
		Company: "MICROSOFT",
		Date:    "11/29/1996",
	},
	{
		ID:      "PNG",
		Company: "MICROSOFT",
		Date:    "11/29/1996",
	},
	{
		ID:      "WBN",
		Company: "MICROSOFTWARE",
		Date:    "01/14/1998",
	},
	{
		ID:      "MSI",
		Company: "MICROSTEP",
		Date:    "11/29/1996",
	},
	{
		ID:      "MCT",
		Company: "MICROTEC",
		Date:    "11/29/1996",
	},
	{
		ID:      "MTJ",
		Company: "MICROTECHNICA CO.,LTD.",
		Date:    "01/04/2016",
	},
	{
		ID:      "MKT",
		Company: "MICROTEK INC.",
		Date:    "07/14/2005",
	},
	{
		ID:      "MTK",
		Company: "MICROTEK INTERNATIONAL INC.",
		Date:    "02/25/2002",
	},
	{
		ID:      "MSY",
		Company: "MICROTOUCH SYSTEMS INC",
		Date:    "08/10/2000",
	},
	{
		ID:      "MVS",
		Company: "MICROVISION",
		Date:    "02/13/2009",
	},
	{
		ID:      "MVD",
		Company: "MICROVITEC PLC",
		Date:    "11/29/1996",
	},
	{
		ID:      "MWY",
		Company: "MICROWAY INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "MDC",
		Company: "MIDORI ELECTRONICS",
		Date:    "11/29/1996",
	},
	{
		ID:      "SFT",
		Company: "MIKROFORUM RING 3",
		Date:    "11/02/2004",
	},
	{
		ID:      "MLC",
		Company: "MILCOTS",
		Date:    "07/15/2020",
	},
	{
		ID:      "MDF",
		Company: "MILDEF AB",
		Date:    "06/23/2016",
	},
	{
		ID:      "MLS",
		Company: "MILESTONE EPE",
		Date:    "08/11/1998",
	},
	{
		ID:      "MLM",
		Company: "MILLENNIUM ENGINEERING INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "MLL",
		Company: "MILLOGIC LTD.",
		Date:    "01/09/2014",
	},
	{
		ID:      "MCX",
		Company: "MILLSON CUSTOM SOLUTIONS INC.",
		Date:    "10/17/2013",
	},
	{
		ID:      "VTM",
		Company: "MILTOPE CORPORATION",
		Date:    "09/23/2009",
	},
	{
		ID:      "MIM",
		Company: "MIMIO – A NEWELL RUBBERMAID COMPANY",
		Date:    "07/31/2012",
	},
	{
		ID:      "MMT",
		Company: "MIMO MONITORS",
		Date:    "10/22/2019",
	},
	{
		ID:      "MTD",
		Company: "MINDTECH DISPLAY CO. LTD",
		Date:    "06/14/2007",
	},
	{
		ID:      "FTW",
		Company: "MINDTRIBE PRODUCT ENGINEERING, INC.",
		Date:    "02/14/2011",
	},
	{
		ID:      "MNC",
		Company: "MINI MICRO METHODS LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "MIN",
		Company: "MINICOM DIGITAL SIGNAGE",
		Date:    "08/13/2010",
	},
	{
		ID:      "MMN",
		Company: "MINIMAN INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "MMF",
		Company: "MINNESOTA MINING AND MANUFACTURING",
		Date:    "03/15/2001",
	},
	{
		ID:      "MRA",
		Company: "MIRANDA TECHNOLOGIES INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "MRL",
		Company: "MIRATEL",
		Date:    "10/16/1998",
	},
	{
		ID:      "MIR",
		Company: "MIRO COMPUTER PROD.",
		Date:    "11/29/1996",
	},
	{
		ID:      "MID",
		Company: "MIRO DISPLAYS",
		Date:    "03/20/1999",
	},
	{
		ID:      "MSP",
		Company: "MISTRAL SOLUTIONS [P] LTD.",
		Date:    "09/23/1998",
	},
	{
		ID:      "MII",
		Company: "MITEC INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "MTL",
		Company: "MITEL CORPORATION",
		Date:    "08/01/1997",
	},
	{
		ID:      "MTR",
		Company: "MITRON COMPUTER INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "MEL",
		Company: "MITSUBISHI ELECTRIC CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "MEE",
		Company: "MITSUBISHI ELECTRIC ENGINEERING CO., LTD.",
		Date:    "10/03/2005",
	},
	{
		ID:      "KMC",
		Company: "MITSUMI COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "MJS",
		Company: "MJS DESIGNS",
		Date:    "11/29/1996",
	},
	{
		ID:      "MKS",
		Company: "MK SEIKO CO., LTD.",
		Date:    "06/18/2013",
	},
	{
		ID:      "MMS",
		Company: "MMS ELECTRONICS",
		Date:    "02/24/1998",
	},
	{
		ID:      "FST",
		Company: "MODESTO PC INC",
		Date:    "02/27/1997",
	},
	{
		ID:      "MDD",
		Company: "MODIS",
		Date:    "11/08/1999",
	},
	{
		ID:      "MIS",
		Company: "MODULAR INDUSTRIAL SOLUTIONS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "MOD",
		Company: "MODULAR TECHNOLOGY",
		Date:    "06/09/1997",
	},
	{
		ID:      "MOM",
		Company: "MOMENTUM DATA SYSTEMS",
		Date:    "01/18/2008",
	},
	{
		ID:      "MNL",
		Company: "MONORAIL INC",
		Date:    "02/18/1997",
	},
	{
		ID:      "MYA",
		Company: "MONYDATA",
		Date:    "11/29/1996",
	},
	{
		ID:      "MBV",
		Company: "MORETON BAY",
		Date:    "01/13/2000",
	},
	{
		ID:      "MOS",
		Company: "MOSES CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "MSV",
		Company: "MOSGI CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "MCO",
		Company: "MOTION COMPUTING INC.",
		Date:    "05/30/2002",
	},
	{
		ID:      "MTM",
		Company: "MOTIUM",
		Date:    "06/19/2012",
	},
	{
		ID:      "MSU",
		Company: "MOTOROLA",
		Date:    "03/15/2001",
	},
	{
		ID:      "MCL",
		Company: "MOTOROLA COMMUNICATIONS ISRAEL",
		Date:    "07/02/2002",
	},
	{
		ID:      "MCG",
		Company: "MOTOROLA COMPUTER GROUP",
		Date:    "08/14/1997",
	},
	{
		ID:      "MOT",
		Company: "MOTOROLA UDS",
		Date:    "11/29/1996",
	},
	{
		ID:      "MSC",
		Company: "MOUSE SYSTEMS CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "MHQ",
		Company: "MOXA INC.",
		Date:    "10/22/2019",
	},
	{
		ID:      "MEU",
		Company: "MPL AG, ELEKTRONIK-UNTERNEHMEN",
		Date:    "01/15/2016",
	},
	{
		ID:      "MPS",
		Company: "MPS SOFTWARE GMBH",
		Date:    "11/29/1996",
	},
	{
		ID:      "MST",
		Company: "MS TELEMATICA",
		Date:    "04/28/1997",
	},
	{
		ID:      "MEX",
		Company: "MSC VERTRIEBS GMBH",
		Date:    "06/04/2012",
	},
	{
		ID:      "MSG",
		Company: "MSI GMBH",
		Date:    "09/13/1999",
	},
	{
		ID:      "MTN",
		Company: "MTRON STORAGE TECHNOLOGY CO., LTD.",
		Date:    "06/17/2008",
	},
	{
		ID:      "MUD",
		Company: "MULTI-DIMENSION INSTITUTE",
		Date:    "10/23/2000",
	},
	{
		ID:      "MTS",
		Company: "MULTI-TECH SYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "MMI",
		Company: "MULTIMAX",
		Date:    "11/29/1996",
	},
	{
		ID:      "MQP",
		Company: "MULTIQ PRODUCTS AB",
		Date:    "03/20/1999",
	},
	{
		ID:      "MWI",
		Company: "MULTIWAVE INNOVATION PTE LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "MAI",
		Company: "MUTOH AMERICA INC",
		Date:    "09/13/1999",
	},
	{
		ID:      "MWR",
		Company: "MWARE",
		Date:    "04/24/2001",
	},
	{
		ID:      "MLX",
		Company: "MYLEX CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "MYR",
		Company: "MYRIAD SOLUTIONS LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "WYS",
		Company: "MYSE TECHNOLOGY",
		Date:    "11/29/1996",
	},
	{
		ID:      "NBL",
		Company: "N*ABLE TECHNOLOGIES INC",
		Date:    "04/28/1998",
	},
	{
		ID:      "NTR",
		Company: "N-TRIG INNOVATIVE TECHNOLOGIES, INC.",
		Date:    "10/03/2005",
	},
	{
		ID:      "JEN",
		Company: "N-VISION",
		Date:    "10/23/2000",
	},
	{
		ID:      "NAD",
		Company: "NAD ELECTRONICS",
		Date:    "06/14/2007",
	},
	{
		ID:      "NDK",
		Company: "NAITOH DENSEI CO., LTD.",
		Date:    "04/12/2006",
	},
	{
		ID:      "NCP",
		Company: "NAJING CEC PANDA FPD TECHNOLOGY CO. LTD",
		Date:    "02/24/2015",
	},
	{
		ID:      "NAK",
		Company: "NAKANO ENGINEERING CO.,LTD.",
		Date:    "07/22/2009",
	},
	{
		ID:      "NYC",
		Company: "NAKAYO RELECOMMUNICATIONS, INC.",
		Date:    "08/10/2000",
	},
	{
		ID:      "SCS",
		Company: "NANOMACH ANSTALT",
		Date:    "11/29/1996",
	},
	{
		ID:      "ADR",
		Company: "NASA AMES RESEARCH CENTER",
		Date:    "11/29/1996",
	},
	{
		ID:      "NDC",
		Company: "NATIONAL DATACOMM CORPORAITON",
		Date:    "11/29/1996",
	},
	{
		ID:      "NDI",
		Company: "NATIONAL DISPLAY SYSTEMS",
		Date:    "08/08/2003",
	},
	{
		ID:      "NIC",
		Company: "NATIONAL INSTRUMENTS CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "NBS",
		Company: "NATIONAL KEY LAB. ON ISN",
		Date:    "07/16/1998",
	},
	{
		ID:      "NSC",
		Company: "NATIONAL SEMICONDUCTOR CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "TTB",
		Company: "NATIONAL SEMICONDUCTOR JAPAN LTD",
		Date:    "04/14/1997",
	},
	{
		ID:      "NTL",
		Company: "NATIONAL TRANSCOMM. LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "ZIC",
		Company: "NATIONZ TECHNOLOGIES INC.",
		Date:    "03/12/2009",
	},
	{
		ID:      "NMS",
		Company: "NATURAL MICRO SYSTEM",
		Date:    "11/29/1996",
	},
	{
		ID:      "NAT",
		Company: "NATURALPOINT INC.",
		Date:    "09/03/2010",
	},
	{
		ID:      "NVT",
		Company: "NAVATEK ENGINEERING CORPORATION",
		Date:    "03/02/1998",
	},
	{
		ID:      "NME",
		Company: "NAVICO, INC.",
		Date:    "11/28/2012",
	},
	{
		ID:      "NAV",
		Company: "NAVIGATION CORPORATION",
		Date:    "02/22/1999",
	},
	{
		ID:      "NAX",
		Company: "NAXOS TECNOLOGIA",
		Date:    "12/12/1997",
	},
	{
		ID:      "NAC",
		Company: "NCAST CORPORATION",
		Date:    "02/14/2006",
	},
	{
		ID:      "DUN",
		Company: "NCR CORPORATION",
		Date:    "04/25/2002",
	},
	{
		ID:      "NCC",
		Company: "NCR CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "NCR",
		Company: "NCR ELECTRONICS",
		Date:    "11/29/1996",
	},
	{
		ID:      "NDF",
		Company: "NDF SPECIAL LIGHT PRODUCTS B.V.",
		Date:    "09/18/2014",
	},
	{
		ID:      "DMV",
		Company: "NDS LTD",
		Date:    "06/25/1997",
	},
	{
		ID:      "NEC",
		Company: "NEC CORPORATION",
		Date:    "05/24/2000",
	},
	{
		ID:      "NCT",
		Company: "NEC CUSTOMTECHNICA, LTD.",
		Date:    "10/23/2002",
	},
	{
		ID:      "NMV",
		Company: "NEC-MITSUBISHI ELECTRIC VISUAL SYSTEMS CORPORATION",
		Date:    "02/25/2002",
	},
	{
		ID:      "NEO",
		Company: "NEO TELECOM CO.,LTD.",
		Date:    "11/08/1999",
	},
	{
		ID:      "NMX",
		Company: "NEOMAGIC",
		Date:    "11/29/1996",
	},
	{
		ID:      "NTC",
		Company: "NEOTECH S.R.L",
		Date:    "11/11/1997",
	},
	{
		ID:      "NTX",
		Company: "NETACCESS INC",
		Date:    "02/07/1997",
	},
	{
		ID:      "NCL",
		Company: "NETCOMM LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "NVC",
		Company: "NETVISION CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "NAL",
		Company: "NETWORK ALCHEMY",
		Date:    "09/30/1997",
	},
	{
		ID:      "NDL",
		Company: "NETWORK DESIGNERS",
		Date:    "11/29/1996",
	},
	{
		ID:      "NGC",
		Company: "NETWORK GENERAL",
		Date:    "08/26/1997",
	},
	{
		ID:      "NIT",
		Company: "NETWORK INFO TECHNOLOGY",
		Date:    "11/29/1996",
	},
	{
		ID:      "NPI",
		Company: "NETWORK PERIPHERALS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "NST",
		Company: "NETWORK SECURITY TECHNOLOGY CO",
		Date:    "02/22/1999",
	},
	{
		ID:      "NTW",
		Company: "NETWORTH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "NSA",
		Company: "NEUROSKY, INC.",
		Date:    "08/28/2013",
	},
	{
		ID:      "NEU",
		Company: "NEUROTEC - EMPRESA DE PESQUISA E DESENVOLVIMENTO EM BIOMEDICINA",
		Date:    "03/15/2001",
	},
	{
		ID:      "NTI",
		Company: "NEW TECH INT'L COMPANY",
		Date:    "11/29/1996",
	},
	{
		ID:      "NCI",
		Company: "NEWCOM INC",
		Date:    "01/09/1997",
	},
	{
		ID:      "NWS",
		Company: "NEWISYS, INC.",
		Date:    "10/08/2002",
	},
	{
		ID:      "NSS",
		Company: "NEWPORT SYSTEMS SOLUTIONS",
		Date:    "11/29/1996",
	},
	{
		ID:      "NTK",
		Company: "NEWTEK",
		Date:    "06/22/2017",
	},
	{
		ID:      "NXG",
		Company: "NEXGEN",
		Date:    "11/29/1996",
	},
	{
		ID:      "NEX",
		Company: "NEXGEN MEDIATECH INC.,",
		Date:    "11/11/2003",
	},
	{
		ID:      "NXQ",
		Company: "NEXIQ TECHNOLOGIES, INC.",
		Date:    "10/08/2001",
	},
	{
		ID:      "NLC",
		Company: "NEXT LEVEL COMMUNICATIONS",
		Date:    "11/29/1996",
	},
	{
		ID:      "NXC",
		Company: "NEXTCOM K.K.",
		Date:    "11/29/1996",
	},
	{
		ID:      "NBT",
		Company: "NINGBO BESTWINNING TECHNOLOGY CO., LTD",
		Date:    "09/05/2006",
	},
	{
		ID:      "BOI",
		Company: "NINGBO BOIGLE DIGITAL TECHNOLOGY CO.,LTD",
		Date:    "11/25/2009",
	},
	{
		ID:      "AVI",
		Company: "NIPPON AVIONICS CO.,LTD",
		Date:    "10/23/2000",
	},
	{
		ID:      "GSB",
		Company: "NIPPONDENCHI CO,.LTD",
		Date:    "05/24/2000",
	},
	{
		ID:      "NSI",
		Company: "NISSEI ELECTRIC CO.,LTD",
		Date:    "01/13/2000",
	},
	{
		ID:      "NIS",
		Company: "NISSEI ELECTRIC COMPANY",
		Date:    "11/29/1996",
	},
	{
		ID:      "NTS",
		Company: "NITS TECHNOLOGY INC.",
		Date:    "12/19/2006",
	},
	{
		ID:      "NCA",
		Company: "NIXDORF COMPANY",
		Date:    "11/29/1996",
	},
	{
		ID:      "NNC",
		Company: "NNC",
		Date:    "11/29/1996",
	},
	{
		ID:      "NDS",
		Company: "NOKIA DATA",
		Date:    "11/29/1996",
	},
	{
		ID:      "NOK",
		Company: "NOKIA DISPLAY PRODUCTS",
		Date:    "11/29/1996",
	},
	{
		ID:      "NMP",
		Company: "NOKIA MOBILE PHONES",
		Date:    "11/29/1996",
	},
	{
		ID:      "NOR",
		Company: "NORAND CORPORATION",
		Date:    "03/19/1997",
	},
	{
		ID:      "NCE",
		Company: "NORCENT TECHNOLOGY, INC.",
		Date:    "06/20/2007",
	},
	{
		ID:      "NOE",
		Company: "NORDICEYE AB",
		Date:    "09/23/2009",
	},
	{
		ID:      "NRI",
		Company: "NORITAKE ITRON CORPORATION",
		Date:    "11/13/2017",
	},
	{
		ID:      "NOI",
		Company: "NORTH INVENT A/S",
		Date:    "05/04/2010",
	},
	{
		ID:      "NCS",
		Company: "NORTHGATE COMPUTER SYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "NOT",
		Company: "NOT LIMITED INC",
		Date:    "01/30/1998",
	},
	{
		ID:      "NWP",
		Company: "NOVAWEB TECHNOLOGIES INC",
		Date:    "06/12/1998",
	},
	{
		ID:      "NVL",
		Company: "NOVELL INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "NSP",
		Company: "NSPIRE SYSTEM INC.",
		Date:    "02/13/2007",
	},
	{
		ID:      "NTT",
		Company: "NTT ADVANCED TECHNOLOGY CORPORATION",
		Date:    "08/19/2004",
	},
	{
		ID:      "NUI",
		Company: "NU INC.",
		Date:    "08/29/2007",
	},
	{
		ID:      "NUG",
		Company: "NU TECHNOLOGY, INC.",
		Date:    "04/16/2004",
	},
	{
		ID:      "NFS",
		Company: "NUMBER FIVE SOFTWARE",
		Date:    "02/22/1999",
	},
	{
		ID:      "KNX",
		Company: "NUTECH MARKETING PTL",
		Date:    "11/29/1996",
	},
	{
		ID:      "NVI",
		Company: "NUVISION US, INC.",
		Date:    "09/05/2006",
	},
	{
		ID:      "NTN",
		Company: "NUVOTON TECHNOLOGY CORPORATION",
		Date:    "10/09/2008",
	},
	{
		ID:      "NVD",
		Company: "NVIDIA",
		Date:    "11/29/1996",
	},
	{
		ID:      "NWC",
		Company: "NW COMPUTER ENGINEERING",
		Date:    "02/03/1997",
	},
	{
		ID:      "NXP",
		Company: "NXP SEMICONDUCTORS BV.",
		Date:    "06/14/2007",
	},
	{
		ID:      "NXT",
		Company: "NZXT (PNP SAME EDID)_",
		Date:    "07/15/2020",
	},
	{
		ID:      "OAK",
		Company: "OAK TECH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "OAS",
		Company: "OASYS TECHNOLOGY COMPANY",
		Date:    "11/29/1996",
	},
	{
		ID:      "OMC",
		Company: "OBJIX MULTIMEDIA CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "PCB",
		Company: "OCTAL S.A.",
		Date:    "02/24/1998",
	},
	{
		ID:      "OVR",
		Company: "OCULUS VR, INC.",
		Date:    "10/19/2012",
	},
	{
		ID:      "ODM",
		Company: "ODME INC.",
		Date:    "09/23/1998",
	},
	{
		ID:      "ODR",
		Company: "ODRAC",
		Date:    "06/21/2001",
	},
	{
		ID:      "ATV",
		Company: "OFFICE DEPOT, INC.",
		Date:    "06/13/2007",
	},
	{
		ID:      "OKI",
		Company: "OKI ELECTRIC INDUSTRIAL COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "OQI",
		Company: "OKSORI COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "OSR",
		Company: "OKSORI COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "OCN",
		Company: "OLFAN",
		Date:    "11/29/1996",
	},
	{
		ID:      "OLC",
		Company: "OLICOM A/S",
		Date:    "11/29/1996",
	},
	{
		ID:      "OLD",
		Company: "OLIDATA S.P.A.",
		Date:    "03/13/2006",
	},
	{
		ID:      "OLT",
		Company: "OLITEC S.A.",
		Date:    "11/29/1996",
	},
	{
		ID:      "OLV",
		Company: "OLITEC S.A.",
		Date:    "11/29/1996",
	},
	{
		ID:      "OLI",
		Company: "OLIVETTI",
		Date:    "11/29/1996",
	},
	{
		ID:      "OLY",
		Company: "OLYMPUS CORPORATION",
		Date:    "05/02/2005",
	},
	{
		ID:      "OTK",
		Company: "OMNITEK",
		Date:    "09/19/2013",
	},
	{
		ID:      "OMN",
		Company: "OMNITEL",
		Date:    "04/28/1998",
	},
	{
		ID:      "OMR",
		Company: "OMRON CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "ONS",
		Company: "ON SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ONE",
		Company: "ONEAC CORPORATION",
		Date:    "04/14/1998",
	},
	{
		ID:      "ONK",
		Company: "ONKYO CORPORATION",
		Date:    "06/16/2005",
	},
	{
		ID:      "ONL",
		Company: "ONLIVE, INC",
		Date:    "09/03/2010",
	},
	{
		ID:      "TIV",
		Company: "OOO TECHNOINVEST",
		Date:    "08/05/1997",
	},
	{
		ID:      "OPC",
		Company: "OPCODE INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "OCS",
		Company: "OPEN CONNECT SOLUTIONS",
		Date:    "09/13/1999",
	},
	{
		ID:      "ONW",
		Company: "OPEN NETWORKS LTD",
		Date:    "04/25/2003",
	},
	{
		ID:      "OSI",
		Company: "OPEN STACK, INC.",
		Date:    "07/22/2013",
	},
	{
		ID:      "OPP",
		Company: "OPPO DIGITAL, INC.",
		Date:    "06/19/2012",
	},
	{
		ID:      "OPT",
		Company: "OPTI INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "OSP",
		Company: "OPTI-UPS CORPORATION",
		Date:    "07/01/1997",
	},
	{
		ID:      "OBS",
		Company: "OPTIBASE TECHNOLOGIES",
		Date:    "11/01/2010",
	},
	{
		ID:      "OSD",
		Company: "OPTICAL SYSTEMS DESIGN PTY LTD",
		Date:    "06/03/2013",
	},
	{
		ID:      "OIC",
		Company: "OPTION INDUSTRIAL COMPUTERS",
		Date:    "05/07/2001",
	},
	{
		ID:      "OIN",
		Company: "OPTION INTERNATIONAL",
		Date:    "10/23/2000",
	},
	{
		ID:      "OIM",
		Company: "OPTION INTERNATIONAL",
		Date:    "01/30/1997",
	},
	{
		ID:      "OPV",
		Company: "OPTIVISION INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "OTT",
		Company: "OPTO22, INC.",
		Date:    "10/06/1998",
	},
	{
		ID:      "OTM",
		Company: "OPTOMA CORPORATION          ",
		Date:    "04/20/2010",
	},
	{
		ID:      "OEI",
		Company: "OPTUM ENGINEERING INC.",
		Date:    "08/02/2010",
	},
	{
		ID:      "OTI",
		Company: "ORCHID TECHNOLOGY",
		Date:    "11/29/1996",
	},
	{
		ID:      "ORG",
		Company: "ORGA KARTENSYSTEME GMBH",
		Date:    "10/24/1998",
	},
	{
		ID:      "TOP",
		Company: "ORION COMMUNICATIONS CO., LTD.",
		Date:    "04/30/2007",
	},
	{
		ID:      "ORN",
		Company: "ORION ELECTRIC CO., LTD.",
		Date:    "01/19/2005",
	},
	{
		ID:      "OEC",
		Company: "ORION ELECTRIC CO.,LTD",
		Date:    "01/13/2000",
	},
	{
		ID:      "OSA",
		Company: "OSAKA MICRO COMPUTER, INC.",
		Date:    "09/05/2003",
	},
	{
		ID:      "ORI",
		Company: "OSR OPEN SYSTEMS RESOURCES, INC.",
		Date:    "01/20/1999",
	},
	{
		ID:      "OOS",
		Company: "OSRAM",
		Date:    "04/25/2002",
	},
	{
		ID:      "OUK",
		Company: "OUK COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "OTB",
		Company: "OUTSIDETHEBOXSTUFF.COM",
		Date:    "09/03/2010",
	},
	{
		ID:      "OXU",
		Company: "OXUS RESEARCH S.A.",
		Date:    "11/29/1996",
	},
	{
		ID:      "OZC",
		Company: "OZ CORPORATION",
		Date:    "08/07/2012",
	},
	{
		ID:      "PMS",
		Company: "PABIAN EMBEDDED SYSTEMS",
		Date:    "02/28/2017",
	},
	{
		ID:      "PAC",
		Company: "PACIFIC AVIONICS CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "PCW",
		Company: "PACIFIC COMMWARE INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "PIE",
		Company: "PACIFIC IMAGE ELECTRONICS COMPANY LTD",
		Date:    "10/21/1997",
	},
	{
		ID:      "PBL",
		Company: "PACKARD BELL ELECTRONICS",
		Date:    "11/29/1996",
	},
	{
		ID:      "PBN",
		Company: "PACKARD BELL NEC",
		Date:    "11/29/1996",
	},
	{
		ID:      "PGI",
		Company: "PACSGEAR, INC.",
		Date:    "08/13/2012",
	},
	{
		ID:      "QFF",
		Company: "PADIX CO., INC.",
		Date:    "09/13/1999",
	},
	{
		ID:      "PJT",
		Company: "PAN JIT INTERNATIONAL INC.",
		Date:    "08/03/2004",
	},
	{
		ID:      "PNS",
		Company: "PANASCOPE",
		Date:    "01/01/1994",
	},
	{
		ID:      "MDO",
		Company: "PANASONIC",
		Date:    "11/29/1996",
	},
	{
		ID:      "PLF",
		Company: "PANASONIC AVIONICS CORPORATION",
		Date:    "08/13/2010",
	},
	{
		ID:      "MEI",
		Company: "PANASONIC INDUSTRY COMPANY",
		Date:    "11/29/1996",
	},
	{
		ID:      "PNL",
		Company: "PANELVIEW, INC.",
		Date:    "08/04/2003",
	},
	{
		ID:      "PTL",
		Company: "PANTEL INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "PTA",
		Company: "PAR TECH INC.",
		Date:    "01/26/2011",
	},
	{
		ID:      "PRT",
		Company: "PARADE TECHNOLOGIES, LTD.",
		Date:    "04/06/2012",
	},
	{
		ID:      "PGM",
		Company: "PARADIGM ADVANCED RESEARCH CENTRE",
		Date:    "06/16/2005",
	},
	{
		ID:      "PAR",
		Company: "PARALLAN COMP INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "PLX",
		Company: "PARALLAX GRAPHICS",
		Date:    "11/29/1996",
	},
	{
		ID:      "RCE",
		Company: "PARC D'ACTIVITE DES BELLEVUES",
		Date:    "11/29/1996",
	},
	{
		ID:      "POT",
		Company: "PARROT",
		Date:    "11/25/2014",
	},
	{
		ID:      "PTH",
		Company: "PATHLIGHT TECHNOLOGY INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "PCX",
		Company: "PC XPERTEN",
		Date:    "02/24/1998",
	},
	{
		ID:      "PCT",
		Company: "PC-TEL INC",
		Date:    "05/02/1997",
	},
	{
		ID:      "PCK",
		Company: "PCBANK21",
		Date:    "02/13/2007",
	},
	{
		ID:      "PCM",
		Company: "PCM SYSTEMS CORPORATION",
		Date:    "03/25/1997",
	},
	{
		ID:      "PDS",
		Company: "PD SYSTEMS INTERNATIONAL LTD",
		Date:    "03/20/1999",
	},
	{
		ID:      "PDT",
		Company: "PDTS - PROZESSDATENTECHNIK UND SYSTEME",
		Date:    "02/10/1998",
	},
	{
		ID:      "PEG",
		Company: "PEGATRON CORPORATION",
		Date:    "08/27/2013",
	},
	{
		ID:      "PEI",
		Company: "PEI ELECTRONICS INC",
		Date:    "04/06/1998",
	},
	{
		ID:      "PVM",
		Company: "PENTA STUDIOTECHNIK GMBH",
		Date:    "05/05/2010",
	},
	{
		ID:      "PCL",
		Company: "PENTEL.CO.,LTD",
		Date:    "02/25/2002",
	},
	{
		ID:      "PEP",
		Company: "PEPPERCON AG",
		Date:    "04/12/2006",
	},
	{
		ID:      "PPX",
		Company: "PERCEPTIVE PIXEL INC.",
		Date:    "05/04/2010",
	},
	{
		ID:      "PER",
		Company: "PERCEPTIVE SIGNAL TECHNOLOGIES",
		Date:    "05/13/1997",
	},
	{
		ID:      "PRC",
		Company: "PERCOMM",
		Date:    "04/24/2001",
	},
	{
		ID:      "PCO",
		Company: "PERFORMANCE CONCEPTS INC.,",
		Date:    "09/24/2002",
	},
	{
		ID:      "IPN",
		Company: "PERFORMANCE TECHNOLOGIES",
		Date:    "02/24/2004",
	},
	{
		ID:      "PSL",
		Company: "PERLE SYSTEMS LIMITED",
		Date:    "02/22/1999",
	},
	{
		ID:      "PON",
		Company: "PERPETUAL TECHNOLOGIES, LLC",
		Date:    "01/13/2000",
	},
	{
		ID:      "PAM",
		Company: "PETER ANTESBERGER MESSTECHNIK",
		Date:    "04/28/1998",
	},
	{
		ID:      "PSD",
		Company: "PEUS-SYSTEMS GMBH",
		Date:    "11/29/1996",
	},
	{
		ID:      "PCA",
		Company: "PHILIPS BU ADD ON CARD",
		Date:    "11/29/1996",
	},
	{
		ID:      "PHS",
		Company: "PHILIPS COMMUNICATION SYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "PHL",
		Company: "PHILIPS CONSUMER ELECTRONICS COMPANY",
		Date:    "11/29/1996",
	},
	{
		ID:      "PHE",
		Company: "PHILIPS MEDICAL SYSTEMS BOEBLINGEN GMBH",
		Date:    "04/20/2010",
	},
	{
		ID:      "PSC",
		Company: "PHILIPS SEMICONDUCTORS",
		Date:    "11/29/1996",
	},
	{
		ID:      "PXC",
		Company: "PHOENIX CONTACT",
		Date:    "02/27/2008",
	},
	{
		ID:      "PNX",
		Company: "PHOENIX TECHNOLOGIES, LTD.",
		Date:    "11/08/1999",
	},
	{
		ID:      "PPC",
		Company: "PHOENIXTEC POWER COMPANY LTD",
		Date:    "05/16/1999",
	},
	{
		ID:      "PMX",
		Company: "PHOTOMATRIX",
		Date:    "11/29/1996",
	},
	{
		ID:      "PHO",
		Company: "PHOTONICS SYSTEMS INC.",
		Date:    "06/03/2002",
	},
	{
		ID:      "RSC",
		Company: "PHOTOTELESIS",
		Date:    "03/16/1998",
	},
	{
		ID:      "PHY",
		Company: "PHYLON COMMUNICATIONS",
		Date:    "11/29/1996",
	},
	{
		ID:      "PPR",
		Company: "PICPRO",
		Date:    "10/18/2004",
	},
	{
		ID:      "PIC",
		Company: "PICTURALL LTD.",
		Date:    "11/13/2015",
	},
	{
		ID:      "PHC",
		Company: "PIJNENBURG BEHEER N.V.",
		Date:    "04/24/2001",
	},
	{
		ID:      "PVR",
		Company: "PIMAX TECH. CO., LTD",
		Date:    "02/07/2017",
	},
	{
		ID:      "PCI",
		Company: "PIONEER COMPUTER INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "PIO",
		Company: "PIONEER ELECTRONIC CORPORATION",
		Date:    "07/16/1997",
	},
	{
		ID:      "PBV",
		Company: "PITNEY BOWES",
		Date:    "09/13/1999",
	},
	{
		ID:      "PBI",
		Company: "PITNEY BOWES",
		Date:    "11/29/1996",
	},
	{
		ID:      "PQI",
		Company: "PIXEL QI",
		Date:    "06/24/2009",
	},
	{
		ID:      "PVN",
		Company: "PIXEL VISION",
		Date:    "11/29/1996",
	},
	{
		ID:      "PXE",
		Company: "PIXELA CORPORATION",
		Date:    "11/21/2007",
	},
	{
		ID:      "PXN",
		Company: "PIXELNEXT INC",
		Date:    "03/29/2018",
	},
	{
		ID:      "PIX",
		Company: "PIXIE TECH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "PTS",
		Company: "PLAIN TREE SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "PNR",
		Company: "PLANAR SYSTEMS, INC.",
		Date:    "08/11/2003",
	},
	{
		ID:      "PLV",
		Company: "PLUS VISION CORP.",
		Date:    "07/05/2001",
	},
	{
		ID:      "PMC",
		Company: "PMC CONSUMER ELECTRONICS LTD",
		Date:    "12/11/1996",
	},
	{
		ID:      "SPR",
		Company: "PMNS GMBH",
		Date:    "10/08/2002",
	},
	{
		ID:      "PMM",
		Company: "POINT MULTIMEDIA SYSTEM",
		Date:    "06/09/1997",
	},
	{
		ID:      "PLY",
		Company: "POLYCOM INC.",
		Date:    "06/19/2002",
	},
	{
		ID:      "POL",
		Company: "POLYCOMP (PTY) LTD.",
		Date:    "02/14/2006",
	},
	{
		ID:      "COW",
		Company: "POLYCOW PRODUCTIONS",
		Date:    "03/15/2001",
	},
	{
		ID:      "POR",
		Company: "PORTALIS LC",
		Date:    "11/01/2008",
	},
	{
		ID:      "POS",
		Company: "POSITIVO TECNOLOGIA S.A.",
		Date:    "09/01/2017",
	},
	{
		ID:      "ARO",
		Company: "POSO INTERNATIONAL B.V.",
		Date:    "08/01/1997",
	},
	{
		ID:      "PEC",
		Company: "POTRANS ELECTRICAL CORP.",
		Date:    "07/16/1999",
	},
	{
		ID:      "PCC",
		Company: "POWERCOM TECHNOLOGY COMPANY LTD",
		Date:    "09/02/1997",
	},
	{
		ID:      "CPX",
		Company: "POWERMATIC DATA SYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "PET",
		Company: "PRACTICAL ELECTRONIC TOOLS",
		Date:    "02/22/1999",
	},
	{
		ID:      "PPI",
		Company: "PRACTICAL PERIPHERALS",
		Date:    "11/29/1996",
	},
	{
		ID:      "PSE",
		Company: "PRACTICAL SOLUTIONS PTE., LTD.",
		Date:    "10/06/1998",
	},
	{
		ID:      "PRD",
		Company: "PRAIM S.R.L.",
		Date:    "11/29/1996",
	},
	{
		ID:      "PEL",
		Company: "PRIMAX ELECTRIC LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "SYX",
		Company: "PRIME SYSTEMS, INC.",
		Date:    "10/21/2003",
	},
	{
		ID:      "PVI",
		Company: "PRIME VIEW INTERNATIONAL CO., LTD",
		Date:    "07/06/2009",
	},
	{
		ID:      "PGS",
		Company: "PRINCETON GRAPHIC SYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "PIM",
		Company: "PRISM, LLC",
		Date:    "07/24/2007",
	},
	{
		ID:      "PRI",
		Company: "PRIVA HORTIMATION BV",
		Date:    "10/22/1997",
	},
	{
		ID:      "PLC",
		Company: "PRO-LOG CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "PRA",
		Company: "PRO/AUTOMATION",
		Date:    "07/16/1999",
	},
	{
		ID:      "PCP",
		Company: "PROCOMP USA INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "PSY",
		Company: "PRODEA SYSTEMS INC.",
		Date:    "02/04/2013",
	},
	{
		ID:      "PDV",
		Company: "PRODRIVE B.V.",
		Date:    "01/18/2005",
	},
	{
		ID:      "PJA",
		Company: "PROJECTA",
		Date:    "01/29/1997",
	},
	{
		ID:      "DHT",
		Company: "PROJECTAVISION INC",
		Date:    "01/14/1998",
	},
	{
		ID:      "PJD",
		Company: "PROJECTIONDESIGN AS",
		Date:    "09/23/2002",
	},
	{
		ID:      "PLM",
		Company: "PROLINK MICROSYSTEMS CORP.",
		Date:    "02/25/2002",
	},
	{
		ID:      "PMT",
		Company: "PROMATE ELECTRONIC CO., LTD.",
		Date:    "01/13/2003",
	},
	{
		ID:      "PRM",
		Company: "PROMETHEUS",
		Date:    "11/29/1996",
	},
	{
		ID:      "PTI",
		Company: "PROMISE TECHNOLOGY INC",
		Date:    "01/02/1997",
	},
	{
		ID:      "PAD",
		Company: "PROMOTION AND DISPLAY TECHNOLOGY LTD.",
		Date:    "04/24/2001",
	},
	{
		ID:      "TEL",
		Company: "PROMOTION AND DISPLAY TECHNOLOGY LTD.",
		Date:    "04/24/2001",
	},
	{
		ID:      "PGP",
		Company: "PROPAGAMMA KOMMUNIKATION",
		Date:    "04/19/2000",
	},
	{
		ID:      "PSM",
		Company: "PROSUM",
		Date:    "11/29/1996",
	},
	{
		ID:      "PRO",
		Company: "PROTEON",
		Date:    "11/29/1996",
	},
	{
		ID:      "PVG",
		Company: "PROVIEW GLOBAL CO., LTD",
		Date:    "10/08/2002",
	},
	{
		ID:      "PXM",
		Company: "PROXIM INC",
		Date:    "09/19/1997",
	},
	{
		ID:      "PRX",
		Company: "PROXIMA CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "PTC",
		Company: "PS TECHNOLOGY CORPORATION",
		Date:    "01/29/1997",
	},
	{
		ID:      "PSI",
		Company: "PSI-PERCEPTIVE SOLUTIONS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "PDM",
		Company: "PSION DACOM PLC.",
		Date:    "11/08/1999",
	},
	{
		ID:      "PLT",
		Company: "PT HARTONO ISTANA TEKNOLOGI",
		Date:    "05/05/2010",
	},
	{
		ID:      "PUL",
		Company: "PULSE-EIGHT LTD",
		Date:    "09/12/2012",
	},
	{
		ID:      "PDR",
		Company: "PURE DATA INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "PPP",
		Company: "PURUP PREPRESS AS",
		Date:    "11/29/1996",
	},
	{
		ID:      "QLC",
		Company: "Q-LOGIC",
		Date:    "11/29/1996",
	},
	{
		ID:      "QDL",
		Company: "QD LASER, INC.",
		Date:    "05/31/2018",
	},
	{
		ID:      "HRE",
		Company: "QINGDAO HAIER ELECTRONICS CO., LTD.",
		Date:    "04/12/2006",
	},
	{
		ID:      "QSC",
		Company: "QSC, LLC",
		Date:    "01/18/2019",
	},
	{
		ID:      "QTR",
		Company: "QTRONIX CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "DHQ",
		Company: "QUADRAM",
		Date:    "11/29/1996",
	},
	{
		ID:      "QDM",
		Company: "QUADRAM",
		Date:    "11/29/1996",
	},
	{
		ID:      "QCL",
		Company: "QUADRANT COMPONENTS INC",
		Date:    "04/03/1997",
	},
	{
		ID:      "QCC",
		Company: "QUAKECOM COMPANY LTD",
		Date:    "03/23/1998",
	},
	{
		ID:      "QCP",
		Company: "QUALCOMM INC",
		Date:    "05/16/1999",
	},
	{
		ID:      "QCI",
		Company: "QUANTA COMPUTER INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "QDS",
		Company: "QUANTA DISPLAY INC.",
		Date:    "04/25/2002",
	},
	{
		ID:      "QTM",
		Company: "QUANTUM",
		Date:    "11/29/1996",
	},
	{
		ID:      "QTD",
		Company: "QUANTUM 3D INC",
		Date:    "05/23/1997",
	},
	{
		ID:      "QDI",
		Company: "QUANTUM DATA INCORPORATED",
		Date:    "03/15/2001",
	},
	{
		ID:      "QSI",
		Company: "QUANTUM SOLUTIONS, INC.",
		Date:    "01/13/2000",
	},
	{
		ID:      "QVU",
		Company: "QUARTICS",
		Date:    "11/04/2010",
	},
	{
		ID:      "QUA",
		Company: "QUATOGRAPHIC AG",
		Date:    "01/13/2000",
	},
	{
		ID:      "QTH",
		Company: "QUESTECH LTD",
		Date:    "01/13/2000",
	},
	{
		ID:      "QUE",
		Company: "QUESTRA CONSULTING",
		Date:    "01/30/1998",
	},
	{
		ID:      "QCK",
		Company: "QUICK CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "QFI",
		Company: "QUICKFLEX, INC",
		Date:    "08/04/1998",
	},
	{
		ID:      "QTI",
		Company: "QUICKNET TECHNOLOGIES INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "RSQ",
		Company: "R SQUARED",
		Date:    "11/08/1999",
	},
	{
		ID:      "RPT",
		Company: "R.P.T.INTERGROUPS",
		Date:    "11/29/1996",
	},
	{
		ID:      "RII",
		Company: "RACAL INTERLAN INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "TSF",
		Company: "RACAL-AIRTECH SOFTWARE FORGE LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "RAC",
		Company: "RACORE COMPUTER PRODUCTS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "RRI",
		Company: "RADICOM RESEARCH INC",
		Date:    "12/02/1997",
	},
	{
		ID:      "RCN",
		Company: "RADIO CONSULT SRL",
		Date:    "09/24/2002",
	},
	{
		ID:      "RDN",
		Company: "RADIODATA GMBH",
		Date:    "07/25/2012",
	},
	{
		ID:      "RLN",
		Company: "RADIOLAN INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "RSN",
		Company: "RADIOSPIRE NETWORKS, INC.",
		Date:    "06/14/2007",
	},
	{
		ID:      "RAD",
		Company: "RADISYS CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "RDS",
		Company: "RADIUS INC",
		Date:    "03/07/1997",
	},
	{
		ID:      "RFI",
		Company: "RAFI GMBH & CO. KG",
		Date:    "08/24/2015",
	},
	{
		ID:      "RDI",
		Company: "RAINBOW DISPLAYS, INC.",
		Date:    "09/23/1998",
	},
	{
		ID:      "RNB",
		Company: "RAINBOW TECHNOLOGIES",
		Date:    "11/29/1996",
	},
	{
		ID:      "RTS",
		Company: "RAINTREE SYSTEMS",
		Date:    "10/02/2001",
	},
	{
		ID:      "BOB",
		Company: "RAINY ORCHARD",
		Date:    "02/21/2000",
	},
	{
		ID:      "RSI",
		Company: "RAMPAGE SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "RAN",
		Company: "RANCHO TECH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "RTI",
		Company: "RANCHO TECH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "RSX",
		Company: "RAPID TECH CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "RMC",
		Company: "RARITAN COMPUTER, INC",
		Date:    "11/27/1998",
	},
	{
		ID:      "RAR",
		Company: "RARITAN, INC.",
		Date:    "06/14/2007",
	},
	{
		ID:      "RAS",
		Company: "RASCOM INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "REX",
		Company: "RATOC SYSTEMS, INC.",
		Date:    "01/06/2012",
	},
	{
		ID:      "RAY",
		Company: "RAYLAR DESIGN, INC.",
		Date:    "01/13/2000",
	},
	{
		ID:      "RZR",
		Company: "RAZER TAIWAN CO. LTD.",
		Date:    "08/20/2018",
	},
	{
		ID:      "RCI",
		Company: "RC INTERNATIONAL",
		Date:    "11/29/1996",
	},
	{
		ID:      "RCH",
		Company: "REACH TECHNOLOGY INC",
		Date:    "02/09/1998",
	},
	{
		ID:      "RKC",
		Company: "REAKIN TECHNOLOHY CORPORATION",
		Date:    "03/15/2001",
	},
	{
		ID:      "REA",
		Company: "REAL D",
		Date:    "11/15/2007",
	},
	{
		ID:      "RTL",
		Company: "REALTEK SEMICONDUCTOR COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "ALG",
		Company: "REALTEK SEMICONDUCTOR CORP.",
		Date:    "10/25/2002",
	},
	{
		ID:      "RVI",
		Company: "REALVISION INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "REC",
		Company: "RECOM",
		Date:    "05/16/1999",
	},
	{
		ID:      "RHT",
		Company: "RED HAT, INC.",
		Date:    "02/17/2011",
	},
	{
		ID:      "RWC",
		Company: "RED WING CORPORATION",
		Date:    "01/08/1998",
	},
	{
		ID:      "RFX",
		Company: "REDFOX TECHNOLOGIES INC.",
		Date:    "01/14/2014",
	},
	{
		ID:      "REF",
		Company: "REFLECTIVITY, INC.",
		Date:    "04/19/2000",
	},
	{
		ID:      "REH",
		Company: "REHAN ELECTRONICS LTD.",
		Date:    "02/15/2012",
	},
	{
		ID:      "RTC",
		Company: "RELIA TECHNOLOGIES",
		Date:    "11/29/1996",
	},
	{
		ID:      "REL",
		Company: "RELIANCE ELECTRIC IND CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "REN",
		Company: "RENESAS TECHNOLOGY CORP.",
		Date:    "06/14/2007",
	},
	{
		ID:      "RAT",
		Company: "RENT-A-TECH",
		Date:    "02/22/1999",
	},
	{
		ID:      "RED",
		Company: "RESEARCH ELECTRONICS DEVELOPMENT INC",
		Date:    "12/02/1997",
	},
	{
		ID:      "RMP",
		Company: "RESEARCH MACHINES",
		Date:    "11/29/1996",
	},
	{
		ID:      "RES",
		Company: "RESMED PTY LTD",
		Date:    "02/21/2000",
	},
	{
		ID:      "RET",
		Company: "RESONANCE TECHNOLOGY, INC.",
		Date:    "02/09/2011",
	},
	{
		ID:      "WTS",
		Company: "RESTEK ELECTRIC COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "RVL",
		Company: "REVEAL COMPUTER PROD",
		Date:    "11/29/1996",
	},
	{
		ID:      "REV",
		Company: "REVOLUTION DISPLAY, INC.",
		Date:    "03/19/2014",
	},
	{
		ID:      "RGB",
		Company: "RGB SPECTRUM",
		Date:    "11/14/2012",
	},
	{
		ID:      "EXN",
		Company: "RGB SYSTEMS, INC. DBA EXTRON ELECTRONICS",
		Date:    "07/06/2008",
	},
	{
		ID:      "RIC",
		Company: "RICOH COMPANY, LTD.",
		Date:    "05/13/2010",
	},
	{
		ID:      "RHD",
		Company: "RIGHTHAND TECHNOLOGIES",
		Date:    "05/01/2012",
	},
	{
		ID:      "RIO",
		Company: "RIOS SYSTEMS COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "RIT",
		Company: "RITECH INC",
		Date:    "04/14/1998",
	},
	{
		ID:      "RIV",
		Company: "RIVULET COMMUNICATIONS",
		Date:    "07/19/2007",
	},
	{
		ID:      "BSG",
		Company: "ROBERT BOSCH GMBH",
		Date:    "05/15/2014",
	},
	{
		ID:      "GRY",
		Company: "ROBERT GRAY COMPANY",
		Date:    "03/31/1998",
	},
	{
		ID:      "RGL",
		Company: "ROBERTSON GEOLOGGING LTD",
		Date:    "08/10/2000",
	},
	{
		ID:      "ROB",
		Company: "ROBUST ELECTRONICS GMBH",
		Date:    "01/18/2008",
	},
	{
		ID:      "RAI",
		Company: "ROCKWELL AUTOMATION/INTECOLOR",
		Date:    "03/13/1998",
	},
	{
		ID:      "RCO",
		Company: "ROCKWELL COLLINS",
		Date:    "09/10/2010",
	},
	{
		ID:      "ASY",
		Company: "ROCKWELL COLLINS / AIRSHOW SYSTEMS",
		Date:    "12/02/2004",
	},
	{
		ID:      "COL",
		Company: "ROCKWELL COLLINS, INC.",
		Date:    "06/14/2007",
	},
	{
		ID:      "ROK",
		Company: "ROCKWELL INTERNATIONAL",
		Date:    "11/29/1996",
	},
	{
		ID:      "RSS",
		Company: "ROCKWELL SEMICONDUCTOR SYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "MAX",
		Company: "ROGEN TECH DISTRIBUTION INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ROS",
		Company: "ROHDE & SCHWARZ",
		Date:    "01/20/2012",
	},
	{
		ID:      "ROH",
		Company: "ROHM CO., LTD.",
		Date:    "06/16/2004",
	},
	{
		ID:      "RHM",
		Company: "ROHM COMPANY LTD",
		Date:    "05/13/1997",
	},
	{
		ID:      "RJA",
		Company: "ROLAND CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "RPI",
		Company: "ROOMPRO TECHNOLOGIES",
		Date:    "07/09/2010",
	},
	{
		ID:      "ROP",
		Company: "ROPER INTERNATIONAL LTD",
		Date:    "05/16/1999",
	},
	{
		ID:      "RMT",
		Company: "ROPER MOBILE",
		Date:    "07/02/2010",
	},
	{
		ID:      "RSV",
		Company: "ROSS VIDEO LTD",
		Date:    "06/11/2012",
	},
	{
		ID:      "TRL",
		Company: "ROYAL INFORMATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "RZS",
		Company: "ROZSNYÓ, S.R.O.",
		Date:    "03/24/2014",
	},
	{
		ID:      "RVC",
		Company: "RSI SYSTEMS INC",
		Date:    "04/28/1998",
	},
	{
		ID:      "RUN",
		Company: "RUNCO INTERNATIONAL",
		Date:    "04/01/2004",
	},
	{
		ID:      "SNK",
		Company: "S&K ELECTRONICS",
		Date:    "02/21/2000",
	},
	{
		ID:      "SSI",
		Company: "S-S TECHNOLOGY INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "TLV",
		Company: "S3 INC",
		Date:    "01/07/1997",
	},
	{
		ID:      "SIM",
		Company: "S3 INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "SSS",
		Company: "S3 INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "SAE",
		Company: "SAAB AEROTECH",
		Date:    "06/14/2007",
	},
	{
		ID:      "SAI",
		Company: "SAGE INC",
		Date:    "07/16/1997",
	},
	{
		ID:      "SGM",
		Company: "SAGEM",
		Date:    "09/05/2003",
	},
	{
		ID:      "SDK",
		Company: "SAIT-DEVLONICS",
		Date:    "11/29/1996",
	},
	{
		ID:      "SAK",
		Company: "SAITEK LTD",
		Date:    "05/16/1999",
	},
	{
		ID:      "SLT",
		Company: "SALT INTERNATIOINAL CORP.",
		Date:    "09/05/2006",
	},
	{
		ID:      "SAM",
		Company: "SAMSUNG ELECTRIC COMPANY",
		Date:    "11/29/1996",
	},
	{
		ID:      "SKT",
		Company: "SAMSUNG ELECTRO-MECHANICS COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "SSE",
		Company: "SAMSUNG ELECTRONIC CO.",
		Date:    "08/10/2000",
	},
	{
		ID:      "STN",
		Company: "SAMSUNG ELECTRONICS AMERICA",
		Date:    "08/10/2000",
	},
	{
		ID:      "KYK",
		Company: "SAMSUNG ELECTRONICS AMERICA INC",
		Date:    "02/24/1998",
	},
	{
		ID:      "SEM",
		Company: "SAMSUNG ELECTRONICS COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "SDI",
		Company: "SAMTRON DISPLAYS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "JSK",
		Company: "SANKEN ELECTRIC CO., LTD",
		Date:    "09/13/1999",
	},
	{
		ID:      "SSJ",
		Company: "SANKYO SEIKI MFG.CO., LTD",
		Date:    "01/28/2003",
	},
	{
		ID:      "SAA",
		Company: "SANRITZ AUTOMATION CO.,LTD.",
		Date:    "02/25/2002",
	},
	{
		ID:      "STK",
		Company: "SANTAK CORP.",
		Date:    "11/27/1998",
	},
	{
		ID:      "SOC",
		Company: "SANTEC CORPORATION",
		Date:    "01/12/2015",
	},
	{
		ID:      "SAN",
		Company: "SANYO ELECTRIC CO.,LTD.",
		Date:    "11/08/1999",
	},
	{
		ID:      "SCD",
		Company: "SANYO ELECTRIC COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "SIB",
		Company: "SANYO ELECTRIC COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "TSC",
		Company: "SANYO ELECTRIC COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "ICN",
		Company: "SANYO ICON",
		Date:    "11/29/1996",
	},
	{
		ID:      "SPN",
		Company: "SAPIENCE CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "SDA",
		Company: "SAT (SOCIETE ANONYME)",
		Date:    "11/29/1996",
	},
	{
		ID:      "AVV",
		Company: "SBS TECHNOLOGIES (CANADA), INC. (WAS AVVIDA SYSTEMS, INC.)",
		Date:    "12/17/2002",
	},
	{
		ID:      "SBS",
		Company: "SBS-OR INDUSTRIAL COMPUTERS GMBH",
		Date:    "12/28/1998",
	},
	{
		ID:      "SGI",
		Company: "SCAN GROUP LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "SCN",
		Company: "SCANPORT, INC.",
		Date:    "08/05/2002",
	},
	{
		ID:      "KFC",
		Company: "SCD TECH",
		Date:    "10/23/2002",
	},
	{
		ID:      "SPT",
		Company: "SCEPTRE TECH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "SMB",
		Company: "SCHLUMBERGER",
		Date:    "07/16/1999",
	},
	{
		ID:      "SCH",
		Company: "SCHLUMBERGER CARDS",
		Date:    "04/28/1998",
	},
	{
		ID:      "SLR",
		Company: "SCHLUMBERGER TECHNOLOGY CORPORATE",
		Date:    "08/10/2000",
	},
	{
		ID:      "SKD",
		Company: "SCHNEIDER & KOCH",
		Date:    "11/29/1996",
	},
	{
		ID:      "PRF",
		Company: "SCHNEIDER ELECTRIC JAPAN HOLDINGS, LTD.",
		Date:    "01/02/2003",
	},
	{
		ID:      "MGE",
		Company: "SCHNEIDER ELECTRIC S.A.",
		Date:    "11/29/1996",
	},
	{
		ID:      "SLS",
		Company: "SCHNICK-SCHNACK-SYSTEMS GMBH",
		Date:    "05/06/2009",
	},
	{
		ID:      "REM",
		Company: "SCI SYSTEMS INC.",
		Date:    "08/10/2000",
	},
	{
		ID:      "SCM",
		Company: "SCM MICROSYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "SCP",
		Company: "SCRIPTEL CORPORATION",
		Date:    "06/14/2007",
	},
	{
		ID:      "SDR",
		Company: "SDR SYSTEMS",
		Date:    "03/15/2001",
	},
	{
		ID:      "STY",
		Company: "SDS TECHNOLOGIES",
		Date:    "11/08/1999",
	},
	{
		ID:      "SDX",
		Company: "SDX BUSINESS SYSTEMS LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "NIX",
		Company: "SEANIX TECHNOLOGY INC",
		Date:    "04/09/2007",
	},
	{
		ID:      "SEA",
		Company: "SEANIX TECHNOLOGY INC.",
		Date:    "02/24/1998",
	},
	{
		ID:      "SAG",
		Company: "SEDLBAUER",
		Date:    "11/29/1996",
	},
	{
		ID:      "SEE",
		Company: "SEECOLOR CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "SCB",
		Company: "SEECUBIC B.V.",
		Date:    "11/02/2012",
	},
	{
		ID:      "SRT",
		Company: "SEEREAL TECHNOLOGIES GMBH",
		Date:    "06/27/2005",
	},
	{
		ID:      "SEC",
		Company: "SEIKO EPSON CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "SID",
		Company: "SEIKO INSTRUMENTS INFORMATION DEVICES INC",
		Date:    "12/16/1996",
	},
	{
		ID:      "SIU",
		Company: "SEIKO INSTRUMENTS USA INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "SEI",
		Company: "SEITZ & ASSOCIATES INC",
		Date:    "01/30/1998",
	},
	{
		ID:      "SJE",
		Company: "SEJIN ELECTRON INC",
		Date:    "08/20/1997",
	},
	{
		ID:      "SXG",
		Company: "SELEX GALILEO",
		Date:    "10/01/2012",
	},
	{
		ID:      "STH",
		Company: "SEMTECH CORPORATION",
		Date:    "11/30/2001",
	},
	{
		ID:      "SEN",
		Company: "SENCORE",
		Date:    "05/23/1997",
	},
	{
		ID:      "SET",
		Company: "SENDTEK CORPORATION",
		Date:    "11/08/1999",
	},
	{
		ID:      "SBT",
		Company: "SENSEBOARD TECHNOLOGIES AB",
		Date:    "09/03/2002",
	},
	{
		ID:      "SVR",
		Company: "SENSICS, INC.",
		Date:    "08/27/2015",
	},
	{
		ID:      "STU",
		Company: "SENTELIC CORPORATION",
		Date:    "07/27/2012",
	},
	{
		ID:      "SNC",
		Company: "SENTRONIC INTERNATIONAL CORP.",
		Date:    "10/23/2000",
	},
	{
		ID:      "SEO",
		Company: "SEOS LTD",
		Date:    "02/20/2003",
	},
	{
		ID:      "SEP",
		Company: "SEP ELETRONICA LTDA.",
		Date:    "05/07/2001",
	},
	{
		ID:      "SQT",
		Company: "SEQUENT COMPUTER SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "SES",
		Company: "SESSION CONTROL LLC",
		Date:    "09/03/2010",
	},
	{
		ID:      "SRD",
		Company: "SETRED",
		Date:    "09/05/2006",
	},
	{
		ID:      "SVT",
		Company: "SEVIT CO., LTD.",
		Date:    "06/25/2002",
	},
	{
		ID:      "SYT",
		Company: "SEYEON TECH COMPANY LTD",
		Date:    "12/02/1997",
	},
	{
		ID:      "SVA",
		Company: "SGEG",
		Date:    "02/21/2000",
	},
	{
		ID:      "STM",
		Company: "SGS THOMSON MICROELECTRONICS",
		Date:    "11/11/1997",
	},
	{
		ID:      "OYO",
		Company: "SHADOW SYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "SBC",
		Company: "SHANGHAI BELL TELEPHONE EQUIP MFG CO",
		Date:    "04/30/1998",
	},
	{
		ID:      "HYL",
		Company: "SHANGHAI CHAI MING HUANG INFO&TECH CO, LTD",
		Date:    "02/28/2017",
	},
	{
		ID:      "SGW",
		Company: "SHANGHAI GUOWEI SCIENCE AND TECHNOLOGY CO., LTD.",
		Date:    "01/28/2011",
	},
	{
		ID:      "DPN",
		Company: "SHANGHAI LEXIANG TECHNOLOGY LIMITED",
		Date:    "02/07/2017",
	},
	{
		ID:      "XQU",
		Company: "SHANGHAI SVA-DAV ELECTRONICS CO., LTD",
		Date:    "07/24/2003",
	},
	{
		ID:      "SWL",
		Company: "SHAREDWARE LTD",
		Date:    "08/11/1998",
	},
	{
		ID:      "SMM",
		Company: "SHARK MULTIMEDIA INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "DFK",
		Company: "SHARKTEC A/S",
		Date:    "02/14/2006",
	},
	{
		ID:      "SHP",
		Company: "SHARP CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "SXT",
		Company: "SHARP TAKAYA ELECTRONIC INDUSTRY CO.,LTD.",
		Date:    "06/24/2010",
	},
	{
		ID:      "CZC",
		Company: "SHENZHEN CHUANGZHICHENG TECHNOLOGY CO., LTD.",
		Date:    "10/23/2013",
	},
	{
		ID:      "DLO",
		Company: "SHENZHEN DLODLO TECHNOLOGIES CO., LTD.",
		Date:    "04/29/2019",
	},
	{
		ID:      "IXN",
		Company: "SHENZHEN INET MOBILE INTERNET TECHNOLOGY CO., LTD",
		Date:    "11/04/2014",
	},
	{
		ID:      "SZM",
		Company: "SHENZHEN MTC CO., LTD",
		Date:    "08/09/2013",
	},
	{
		ID:      "RMS",
		Company: "SHENZHEN RAMOS DIGITAL TECHNOLOGY CO., LTD",
		Date:    "10/29/2014",
	},
	{
		ID:      "SSL",
		Company: "SHENZHEN SOUTH-TOP COMPUTER CO., LTD.",
		Date:    "12/06/2013",
	},
	{
		ID:      "AZH",
		Company: "SHENZHEN THREE CONNAUGHT INFORMATION TECHNOLOGY CO., LTD. (3NOD GROUP)",
		Date:    "09/17/2013",
	},
	{
		ID:      "XYE",
		Company: "SHENZHEN ZHUONA TECHNOLOGY CO., LTD.",
		Date:    "10/01/2013",
	},
	{
		ID:      "HTR",
		Company: "SHENZHEN ZHUOYI HENGTONG COMPUTER TECHNOLOGY LIMITED",
		Date:    "12/13/2013",
	},
	{
		ID:      "ZWE",
		Company: "SHENZHEN ZOWEE TECHNOLOGY CO., LTD",
		Date:    "05/26/2015",
	},
	{
		ID:      "SDE",
		Company: "SHERWOOD DIGITAL ELECTRONICS CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "SHC",
		Company: "SHIBASOKU CO., LTD.",
		Date:    "05/26/2005",
	},
	{
		ID:      "SHT",
		Company: "SHIN HO TECH",
		Date:    "11/29/1996",
	},
	{
		ID:      "SLB",
		Company: "SHLUMBERGER LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "SAT",
		Company: "SHUTTLE TECH",
		Date:    "11/29/1996",
	},
	{
		ID:      "CHG",
		Company: "SICHUAN CHANGHONG ELECTRIC CO, LTD.",
		Date:    "02/26/2003",
	},
	{
		ID:      "CHO",
		Company: "SICHUANG CHANGHONG CORPORATION",
		Date:    "11/30/2001",
	},
	{
		ID:      "SIE",
		Company: "SIEMENS",
		Date:    "11/29/1996",
	},
	{
		ID:      "SDT",
		Company: "SIEMENS AG",
		Date:    "02/14/2006",
	},
	{
		ID:      "SIA",
		Company: "SIEMENS AG",
		Date:    "03/15/2001",
	},
	{
		ID:      "SNI",
		Company: "SIEMENS MICRODESIGN GMBH",
		Date:    "11/29/1996",
	},
	{
		ID:      "SNP",
		Company: "SIEMENS NIXDORF INFO SYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "SSC",
		Company: "SIERRA SEMICONDUCTOR INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "SWI",
		Company: "SIERRA WIRELESS INC.",
		Date:    "07/10/2003",
	},
	{
		ID:      "SIG",
		Company: "SIGMA DESIGNS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "SGD",
		Company: "SIGMA DESIGNS, INC.",
		Date:    "02/14/2006",
	},
	{
		ID:      "SCL",
		Company: "SIGMACOM CO., LTD.",
		Date:    "04/25/2002",
	},
	{
		ID:      "STL",
		Company: "SIGMATEL INC",
		Date:    "03/03/1997",
	},
	{
		ID:      "DXS",
		Company: "SIGNET",
		Date:    "10/23/2000",
	},
	{
		ID:      "STE",
		Company: "SII IDO-TSUSHIN INC",
		Date:    "04/03/1997",
	},
	{
		ID:      "SMT",
		Company: "SILCOM MANUFACTURING TECH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "SXI",
		Company: "SILEX INSIDE",
		Date:    "03/29/2018",
	},
	{
		ID:      "SXD",
		Company: "SILEX TECHNOLOGY, INC.",
		Date:    "03/12/2009",
	},
	{
		ID:      "SMS",
		Company: "SILICOM MULTIMEDIA SYSTEMS INC",
		Date:    "12/04/1996",
	},
	{
		ID:      "SGX",
		Company: "SILICON GRAPHICS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "SII",
		Company: "SILICON IMAGE, INC.",
		Date:    "01/13/2000",
	},
	{
		ID:      "SIS",
		Company: "SILICON INTEGRATED SYSTEMS CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "SIL",
		Company: "SILICON LABORATORIES, INC",
		Date:    "07/16/1998",
	},
	{
		ID:      "SLH",
		Company: "SILICON LIBRARY INC.",
		Date:    "11/01/2008",
	},
	{
		ID:      "SOI",
		Company: "SILICON OPTIX CORPORATION",
		Date:    "07/28/2005",
	},
	{
		ID:      "SLK",
		Company: "SILITEK CORPORATION",
		Date:    "07/16/1997",
	},
	{
		ID:      "SPU",
		Company: "SIM2 MULTIMEDIA S.P.A.",
		Date:    "09/05/2002",
	},
	{
		ID:      "SMP",
		Company: "SIMPLE COMPUTING",
		Date:    "11/29/1996",
	},
	{
		ID:      "SPX",
		Company: "SIMPLEX TIME RECORDER CO.",
		Date:    "03/15/2001",
	},
	{
		ID:      "SIN",
		Company: "SINGULAR TECHNOLOGY CO., LTD.",
		Date:    "11/08/1999",
	},
	{
		ID:      "SNO",
		Company: "SINOSUN TECHNOLOGY CO., LTD",
		Date:    "06/27/2005",
	},
	{
		ID:      "SIR",
		Company: "SIRIUS TECHNOLOGIES PTY LTD",
		Date:    "03/13/1998",
	},
	{
		ID:      "FUN",
		Company: "SISEL MUHENDISLIK",
		Date:    "04/25/2002",
	},
	{
		ID:      "STS",
		Company: "SITECSYSTEM CO., LTD.",
		Date:    "03/16/2005",
	},
	{
		ID:      "SIT",
		Company: "SITINTEL",
		Date:    "11/29/1996",
	},
	{
		ID:      "TDG",
		Company: "SIX15 TECHNOLOGIES",
		Date:    "09/14/2016",
	},
	{
		ID:      "SKY",
		Company: "SKYDATA S.P.A.",
		Date:    "09/19/1997",
	},
	{
		ID:      "SKW",
		Company: "SKYWORTH",
		Date:    "07/15/2020",
	},
	{
		ID:      "SCT",
		Company: "SMART CARD TECHNOLOGY",
		Date:    "08/10/2000",
	},
	{
		ID:      "SMA",
		Company: "SMART MODULAR TECHNOLOGIES",
		Date:    "04/04/1997",
	},
	{
		ID:      "SPL",
		Company: "SMART SILICON SYSTEMS PTY LTD",
		Date:    "08/10/2000",
	},
	{
		ID:      "STI",
		Company: "SMART TECH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "SBI",
		Company: "SMART TECHNOLOGIES INC.",
		Date:    "06/14/2007",
	},
	{
		ID:      "SMK",
		Company: "SMK CORPORATION",
		Date:    "02/21/2000",
	},
	{
		ID:      "SNW",
		Company: "SNELL & WILCOX",
		Date:    "04/25/2002",
	},
	{
		ID:      "MVM",
		Company: "SOBO VISION",
		Date:    "06/14/2007",
	},
	{
		ID:      "SCX",
		Company: "SOCIONEXT INC.",
		Date:    "05/14/2015",
	},
	{
		ID:      "LAN",
		Company: "SODEMAN LANCOM INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "SDF",
		Company: "SODIFF E&T CO., LTD.",
		Date:    "06/01/2007",
	},
	{
		ID:      "SHG",
		Company: "SOFT & HARDWARE DEVELOPMENT GOLDAMMER GMBH",
		Date:    "11/29/1996",
	},
	{
		ID:      "SBD",
		Company: "SOFTBED - CONSULTING & DEVELOPMENT LTD",
		Date:    "12/23/1997",
	},
	{
		ID:      "SWC",
		Company: "SOFTWARE CAFÉ",
		Date:    "11/29/1996",
	},
	{
		ID:      "SWT",
		Company: "SOFTWARE TECHNOLOGIES GROUP,INC.",
		Date:    "11/29/2008",
	},
	{
		ID:      "SOL",
		Company: "SOLITRON TECHNOLOGIES INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "SLM",
		Company: "SOLOMON TECHNOLOGY CORPORATION",
		Date:    "01/16/1998",
	},
	{
		ID:      "SXL",
		Company: "SOLUTIONINSIDE",
		Date:    "05/08/2001",
	},
	{
		ID:      "ONX",
		Company: "SOMELEC Z.I. DU VERT GALANTA",
		Date:    "11/29/1996",
	},
	{
		ID:      "HON",
		Company: "SONITRONIX",
		Date:    "02/03/2011",
	},
	{
		ID:      "SNX",
		Company: "SONIX COMM. LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "SNV",
		Company: "SONOVE GMBH",
		Date:    "03/29/2018",
	},
	{
		ID:      "SNY",
		Company: "SONY",
		Date:    "11/29/1996",
	},
	{
		ID:      "SON",
		Company: "SONY",
		Date:    "11/29/1996",
	},
	{
		ID:      "SER",
		Company: "SONY ERICSSON MOBILE COMMUNICATIONS INC.",
		Date:    "04/16/2004",
	},
	{
		ID:      "SCO",
		Company: "SORCUS COMPUTER GMBH",
		Date:    "01/13/2000",
	},
	{
		ID:      "SOR",
		Company: "SORCUS COMPUTER GMBH",
		Date:    "11/29/1996",
	},
	{
		ID:      "SCC",
		Company: "SORD COMPUTER CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "SOT",
		Company: "SOTEC COMPANY LTD",
		Date:    "05/21/1997",
	},
	{
		ID:      "FRS",
		Company: "SOUTH MOUNTAIN TECHNOLOGIES, LTD",
		Date:    "02/14/2006",
	},
	{
		ID:      "SOY",
		Company: "SOYO GROUP, INC",
		Date:    "12/18/2006",
	},
	{
		ID:      "SPI",
		Company: "SPACE-I CO., LTD.",
		Date:    "05/11/2005",
	},
	{
		ID:      "SMI",
		Company: "SPACELABS MEDICAL INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "SPE",
		Company: "SPEA SOFTWARE AG",
		Date:    "11/29/1996",
	},
	{
		ID:      "SPK",
		Company: "SPEAKERCRAFT",
		Date:    "04/20/2010",
	},
	{
		ID:      "SLX",
		Company: "SPECIALIX",
		Date:    "11/29/1996",
	},
	{
		ID:      "SGC",
		Company: "SPECTRAGRAPHICS CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "SSP",
		Company: "SPECTRUM SIGNAL PROECESSING INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "SPC",
		Company: "SPINCORE TECHNOLOGIES, INC",
		Date:    "01/01/1994",
	},
	{
		ID:      "SRS",
		Company: "SR-SYSTEMS E.K.",
		Date:    "11/19/2012",
	},
	{
		ID:      "STA",
		Company: "ST ELECTRONICS SYSTEMS ASSEMBLY PTE LTD",
		Date:    "12/28/1998",
	},
	{
		ID:      "STX",
		Company: "ST-ERICSSON",
		Date:    "12/09/2011",
	},
	{
		ID:      "STC",
		Company: "STAC ELECTRONICS",
		Date:    "11/29/1996",
	},
	{
		ID:      "SMC",
		Company: "STANDARD MICROSYSTEMS CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "STT",
		Company: "STAR PAGING TELECOM TECH (SHENZHEN) CO. LTD.",
		Date:    "09/23/1998",
	},
	{
		ID:      "STF",
		Company: "STARFLIGHT ELECTRONICS",
		Date:    "05/23/1997",
	},
	{
		ID:      "SGT",
		Company: "STARGATE TECHNOLOGY",
		Date:    "11/29/1996",
	},
	{
		ID:      "SLF",
		Company: "STARLEAF",
		Date:    "11/01/2010",
	},
	{
		ID:      "STR",
		Company: "STARLIGHT NETWORKS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "STW",
		Company: "STARWIN INC.",
		Date:    "04/24/2001",
	},
	{
		ID:      "SWS",
		Company: "STATIC",
		Date:    "05/16/1999",
	},
	{
		ID:      "STB",
		Company: "STB SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "STD",
		Company: "STD COMPUTER INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "STG",
		Company: "STEREOGRAPHICS CORP.",
		Date:    "10/02/2001",
	},
	{
		ID:      "SMO",
		Company: "STMICROELECTRONICS",
		Date:    "06/14/2007",
	},
	{
		ID:      "STO",
		Company: "STOLLMANN E+V GMBH",
		Date:    "03/27/1997",
	},
	{
		ID:      "SAS",
		Company: "STORES AUTOMATED SYSTEMS INC",
		Date:    "03/19/1997",
	},
	{
		ID:      "EZP",
		Company: "STORM TECHNOLOGY",
		Date:    "10/17/1996",
	},
	{
		ID:      "STP",
		Company: "STREAMPLAY LTD",
		Date:    "02/04/2009",
	},
	{
		ID:      "SYK",
		Company: "STRYKER COMMUNICATIONS",
		Date:    "10/10/2005",
	},
	{
		ID:      "SUB",
		Company: "SUBSPACE COMM. INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "SML",
		Company: "SUMITOMO METAL INDUSTRIES, LTD.",
		Date:    "09/13/1999",
	},
	{
		ID:      "SUM",
		Company: "SUMMAGRAPHICS CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "SCE",
		Company: "SUN CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "SUN",
		Company: "SUN ELECTRONICS CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "SVI",
		Company: "SUN MICROSYSTEMS",
		Date:    "01/13/2003",
	},
	{
		ID:      "SNN",
		Company: "SUNNY ELEKTRONIK",
		Date:    "11/14/2014",
	},
	{
		ID:      "SDS",
		Company: "SUNRIVER DATA SYSTEM",
		Date:    "11/29/1996",
	},
	{
		ID:      "SGL",
		Company: "SUPER GATE TECHNOLOGY COMPANY LTD",
		Date:    "12/30/1997",
	},
	{
		ID:      "SNT",
		Company: "SUPERNET INC",
		Date:    "04/23/1998",
	},
	{
		ID:      "SUP",
		Company: "SUPRA CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "SUR",
		Company: "SURENAM COMPUTER CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "SRF",
		Company: "SURF COMMUNICATION SOLUTIONS LTD",
		Date:    "03/23/1998",
	},
	{
		ID:      "SVD",
		Company: "SVD COMPUTER",
		Date:    "04/14/1998",
	},
	{
		ID:      "SVS",
		Company: "SVSI",
		Date:    "08/09/2008",
	},
	{
		ID:      "SYE",
		Company: "SY ELECTRONICS LTD",
		Date:    "09/20/2010",
	},
	{
		ID:      "SYL",
		Company: "SYLVANIA COMPUTER PRODUCTS",
		Date:    "06/12/1998",
	},
	{
		ID:      "SLI",
		Company: "SYMBIOS LOGIC INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ISA",
		Company: "SYMBOL TECHNOLOGIES",
		Date:    "06/02/1997",
	},
	{
		ID:      "SYM",
		Company: "SYMICRON COMPUTER COMMUNICATIONS LTD.",
		Date:    "11/29/1996",
	},
	{
		ID:      "SYN",
		Company: "SYNAPTICS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "SPS",
		Company: "SYNOPSYS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "SXB",
		Company: "SYNTAX-BRILLIAN",
		Date:    "05/08/2006",
	},
	{
		ID:      "STQ",
		Company: "SYNTHETEL CORPORATION",
		Date:    "12/21/2015",
	},
	{
		ID:      "SYP",
		Company: "SYPRO CO LTD",
		Date:    "11/27/1998",
	},
	{
		ID:      "SYS",
		Company: "SYSGRATION LTD",
		Date:    "04/28/1997",
	},
	{
		ID:      "SLC",
		Company: "SYSLOGIC DATENTECHNIK AG",
		Date:    "01/20/1999",
	},
	{
		ID:      "SME",
		Company: "SYSMATE COMPANY",
		Date:    "09/02/1997",
	},
	{
		ID:      "SIC",
		Company: "SYSMATE CORPORATION",
		Date:    "05/05/1997",
	},
	{
		ID:      "SYC",
		Company: "SYSMIC",
		Date:    "11/29/1996",
	},
	{
		ID:      "SGZ",
		Company: "SYSTEC COMPUTER GMBH",
		Date:    "10/02/1997",
	},
	{
		ID:      "SCI",
		Company: "SYSTEM CRAFT",
		Date:    "11/29/1996",
	},
	{
		ID:      "SEB",
		Company: "SYSTEM ELEKTRONIK GMBH",
		Date:    "04/19/2000",
	},
	{
		ID:      "SLA",
		Company: "SYSTEME LAUER GMBH&CO KG",
		Date:    "03/20/1999",
	},
	{
		ID:      "UPS",
		Company: "SYSTEMS ENHANCEMENT",
		Date:    "11/29/1996",
	},
	{
		ID:      "SST",
		Company: "SYSTEMSOFT CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "SCR",
		Company: "SYSTRAN CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "SYV",
		Company: "SYVAX INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "TUA",
		Company: "T+A ELEKTROAKUSTIK GMBH",
		Date:    "01/05/2011",
	},
	{
		ID:      "TMT",
		Company: "T-METRICS INC.",
		Date:    "02/21/2000",
	},
	{
		ID:      "TCD",
		Company: "TAICOM DATA SYSTEMS CO., LTD.",
		Date:    "10/08/2001",
	},
	{
		ID:      "TMR",
		Company: "TAICOM INTERNATIONAL INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "TKC",
		Company: "TAIKO ELECTRIC WORKS.LTD",
		Date:    "03/15/2001",
	},
	{
		ID:      "TTX",
		Company: "TAITEX CORPORATION",
		Date:    "02/03/2016",
	},
	{
		ID:      "TVM",
		Company: "TAIWAN VIDEO & MONITOR CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "KTD",
		Company: "TAKAHATA ELECTRONICS CO.,LTD.",
		Date:    "07/22/2009",
	},
	{
		ID:      "TAM",
		Company: "TAMURA SEISAKUSYO LTD",
		Date:    "07/17/1997",
	},
	{
		ID:      "TAA",
		Company: "TANDBERG",
		Date:    "10/21/2003",
	},
	{
		ID:      "TDD",
		Company: "TANDBERG DATA DISPLAY AS",
		Date:    "11/29/1996",
	},
	{
		ID:      "TDM",
		Company: "TANDEM COMPUTER EUROPE INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "TCC",
		Company: "TANDON CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "TDY",
		Company: "TANDY ELECTRONICS",
		Date:    "11/29/1996",
	},
	{
		ID:      "TAS",
		Company: "TASKIT RECHNERTECHNIK GMBH",
		Date:    "12/15/1997",
	},
	{
		ID:      "TCS",
		Company: "TATUNG COMPANY OF AMERICA INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "VIB",
		Company: "TATUNG UK LTD",
		Date:    "07/16/1999",
	},
	{
		ID:      "NRV",
		Company: "TAUGAGREINING HF",
		Date:    "11/29/1996",
	},
	{
		ID:      "TAX",
		Company: "TAXAN (EUROPE) LTD",
		Date:    "03/13/1997",
	},
	{
		ID:      "TOL",
		Company: "TCL CORPORATION",
		Date:    "03/30/2016",
	},
	{
		ID:      "PMD",
		Company: "TDK USA CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "TDT",
		Company: "TDT",
		Date:    "11/29/1996",
	},
	{
		ID:      "TDV",
		Company: "TDVISION SYSTEMS, INC.",
		Date:    "01/18/2008",
	},
	{
		ID:      "TCJ",
		Company: "TEAC AMERICA INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "TEA",
		Company: "TEAC SYSTEM CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "CET",
		Company: "TEC CORPORATION",
		Date:    "07/16/1998",
	},
	{
		ID:      "TEZ",
		Company: "TECH SOURCE INC.",
		Date:    "08/14/2013",
	},
	{
		ID:      "TLN",
		Company: "TECHLOGIX NETWORX",
		Date:    "02/28/2017",
	},
	{
		ID:      "TMC",
		Company: "TECHMEDIA COMPUTER SYSTEMS CORPORATION",
		Date:    "02/10/1998",
	},
	{
		ID:      "TCL",
		Company: "TECHNICAL CONCEPTS LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "TIL",
		Company: "TECHNICAL ILLUSIONS INC.",
		Date:    "02/14/2014",
	},
	{
		ID:      "TSD",
		Company: "TECHNISAT DIGITAL GMBH",
		Date:    "07/14/2005",
	},
	{
		ID:      "NXS",
		Company: "TECHNOLOGY NEXUS SECURE OPEN SYSTEMS AB",
		Date:    "05/08/1998",
	},
	{
		ID:      "TPE",
		Company: "TECHNOLOGY POWER ENTERPRISES INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "TTS",
		Company: "TECHNOTREND SYSTEMTECHNIK GMBH",
		Date:    "11/29/1996",
	},
	{
		ID:      "TEC",
		Company: "TECMAR INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "PIS",
		Company: "TECNART CO.,LTD.",
		Date:    "10/22/2019",
	},
	{
		ID:      "TCN",
		Company: "TECNETICS (PTY) LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "TNM",
		Company: "TECNIMAGEN SA",
		Date:    "05/02/2005",
	},
	{
		ID:      "TVD",
		Company: "TECNOVISION",
		Date:    "03/13/2006",
	},
	{
		ID:      "RXT",
		Company: "TECTONA SOFTSOLUTIONS (P) LTD.,",
		Date:    "06/02/2004",
	},
	{
		ID:      "TKG",
		Company: "TEK GEAR",
		Date:    "10/16/2015",
	},
	{
		ID:      "TKN",
		Company: "TEKNOR MICROSYSTEM INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "TRM",
		Company: "TEKRAM TECHNOLOGY COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "TEK",
		Company: "TEKTRONIX INC",
		Date:    "05/16/1999",
	},
	{
		ID:      "TWX",
		Company: "TEKWORX LIMITED",
		Date:    "12/24/2009",
	},
	{
		ID:      "TCT",
		Company: "TELECOM TECHNOLOGY CENTRE CO. LTD.",
		Date:    "07/16/1999",
	},
	{
		ID:      "TTC",
		Company: "TELECOMMUNICATIONS TECHNIQUES CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "TLF",
		Company: "TELEFORCE.,CO,LTD",
		Date:    "11/19/2012",
	},
	{
		ID:      "TAT",
		Company: "TELELIAISON INC",
		Date:    "04/29/1997",
	},
	{
		ID:      "TLK",
		Company: "TELELINK AG",
		Date:    "09/01/1998",
	},
	{
		ID:      "TPS",
		Company: "TELEPROCESSING SYSTEME GMBH",
		Date:    "01/24/1997",
	},
	{
		ID:      "TAG",
		Company: "TELES AG",
		Date:    "11/29/1996",
	},
	{
		ID:      "TLS",
		Company: "TELESTE EDUCATIONAL OY",
		Date:    "11/29/1996",
	},
	{
		ID:      "TEV",
		Company: "TELEVÉS, S.A.",
		Date:    "06/22/2017",
	},
	{
		ID:      "TCF",
		Company: "TELEVIC CONFERENCE",
		Date:    "02/28/2017",
	},
	{
		ID:      "TSI",
		Company: "TELEVIDEO SYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "PFT",
		Company: "TELIA PROSOFT AB",
		Date:    "09/13/1999",
	},
	{
		ID:      "TLD",
		Company: "TELINDUS",
		Date:    "11/29/1996",
	},
	{
		ID:      "TLX",
		Company: "TELXON CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "TEN",
		Company: "TENCENT",
		Date:    "06/20/2017",
	},
	{
		ID:      "TNY",
		Company: "TENNYSON TECH PTY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "TDC",
		Company: "TERADICI",
		Date:    "10/11/2007",
	},
	{
		ID:      "TER",
		Company: "TERRATEC ELECTRONIC GMBH",
		Date:    "03/21/1997",
	},
	{
		ID:      "TET",
		Company: "TETRADYNE CO., LTD.",
		Date:    "04/27/2016",
	},
	{
		ID:      "TXN",
		Company: "TEXAS INSTURMENTS",
		Date:    "11/29/1996",
	},
	{
		ID:      "TMI",
		Company: "TEXAS MICROSYSTEM",
		Date:    "11/29/1996",
	},
	{
		ID:      "TXT",
		Company: "TEXTRON DEFENSE SYSTEM",
		Date:    "11/29/1996",
	},
	{
		ID:      "TAV",
		Company: "THALES AVIONICS",
		Date:    "11/18/2015",
	},
	{
		ID:      "CKC",
		Company: "THE CONCEPT KEYBOARD COMPANY LTD",
		Date:    "06/02/1997",
	},
	{
		ID:      "LNX",
		Company: "THE LINUX FOUNDATION",
		Date:    "04/04/2014",
	},
	{
		ID:      "PXL",
		Company: "THE MOVING PIXEL COMPANY",
		Date:    "11/24/2003",
	},
	{
		ID:      "ITN",
		Company: "THE NTI GROUP",
		Date:    "11/29/1996",
	},
	{
		ID:      "TOG",
		Company: "THE OPEN GROUP",
		Date:    "09/13/1999",
	},
	{
		ID:      "PAN",
		Company: "THE PANDA PROJECT",
		Date:    "11/29/1996",
	},
	{
		ID:      "PRG",
		Company: "THE PHOENIX RESEARCH GROUP INC",
		Date:    "09/19/1997",
	},
	{
		ID:      "TSG",
		Company: "THE SOFTWARE GROUP LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "TMX",
		Company: "THERMOTREX CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "TLL",
		Company: "THINKLOGICAL",
		Date:    "06/01/2015",
	},
	{
		ID:      "TCO",
		Company: "THOMAS-CONRAD CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "TCR",
		Company: "THOMSON CONSUMER ELECTRONICS",
		Date:    "08/20/1998",
	},
	{
		ID:      "TPT",
		Company: "THRUPUT LTD",
		Date:    "06/16/2010",
	},
	{
		ID:      "THN",
		Company: "THUNDERCOM HOLDINGS SDN. BHD.",
		Date:    "03/21/1997",
	},
	{
		ID:      "TWA",
		Company: "TIDEWATER ASSOCIATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "TMM",
		Company: "TIME MANAGEMENT, INC.",
		Date:    "03/20/1999",
	},
	{
		ID:      "TKS",
		Company: "TIMEKEEPING SYSTEMS, INC.",
		Date:    "08/31/1998",
	},
	{
		ID:      "TPD",
		Company: "TIMES (SHANGHAI) COMPUTER CO., LTD.",
		Date:    "12/12/2013",
	},
	{
		ID:      "TIP",
		Company: "TIPTEL AG",
		Date:    "02/24/1998",
	},
	{
		ID:      "TIX",
		Company: "TIXI.COM GMBH",
		Date:    "10/16/1998",
	},
	{
		ID:      "TNC",
		Company: "TNC INDUSTRIAL COMPANY LTD",
		Date:    "02/27/1998",
	},
	{
		ID:      "TAB",
		Company: "TODOS DATA SYSTEM AB",
		Date:    "08/20/1997",
	},
	{
		ID:      "TOE",
		Company: "TOEI ELECTRONICS CO., LTD.",
		Date:    "10/02/2001",
	},
	{
		ID:      "TON",
		Company: "TONNA",
		Date:    "03/14/2012",
	},
	{
		ID:      "TPV",
		Company: "TOP VICTORY ELECTRONICS ( FUJIAN ) COMPANY LTD",
		Date:    "05/16/1999",
	},
	{
		ID:      "TPK",
		Company: "TOPRE CORPORATION",
		Date:    "02/13/2009",
	},
	{
		ID:      "TPR",
		Company: "TOPRO TECHNOLOGY INC",
		Date:    "05/08/1998",
	},
	{
		ID:      "TTA",
		Company: "TOPSON TECHNOLOGY CO., LTD.",
		Date:    "09/23/1998",
	},
	{
		ID:      "SFM",
		Company: "TORNADO COMPANY",
		Date:    "04/15/1997",
	},
	{
		ID:      "TGS",
		Company: "TORUS SYSTEMS LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "TRS",
		Company: "TORUS SYSTEMS LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "TAI",
		Company: "TOSHIBA AMERICA INFO SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "TSB",
		Company: "TOSHIBA AMERICA INFO SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "TTP",
		Company: "TOSHIBA CORPORATION",
		Date:    "07/07/2015",
	},
	{
		ID:      "TGC",
		Company: "TOSHIBA GLOBAL COMMERCE SOLUTIONS, INC.",
		Date:    "06/26/2012",
	},
	{
		ID:      "LCD",
		Company: "TOSHIBA MATSUSHITA DISPLAY TECHNOLOGY CO., LTD",
		Date:    "05/24/2000",
	},
	{
		ID:      "PCS",
		Company: "TOSHIBA PERSONAL COMPUTER SYSTEM CORPRATION",
		Date:    "06/22/2010",
	},
	{
		ID:      "TLI",
		Company: "TOSHIBA TELI CORPORATION",
		Date:    "01/18/2008",
	},
	{
		ID:      "TVL",
		Company: "TOTAL VISION LTD",
		Date:    "02/07/2017",
	},
	{
		ID:      "TTK",
		Company: "TOTOKU ELECTRIC COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "TSE",
		Company: "TOTTORI SANYO ELECTRIC",
		Date:    "11/29/1996",
	},
	{
		ID:      "TSL",
		Company: "TOTTORI SANYO ELECTRIC CO., LTD.",
		Date:    "11/06/2001",
	},
	{
		ID:      "TPC",
		Company: "TOUCH PANEL SYSTEMS CORPORATION",
		Date:    "09/02/1997",
	},
	{
		ID:      "TKO",
		Company: "TOUCHKO, INC.",
		Date:    "01/12/2006",
	},
	{
		ID:      "TOU",
		Company: "TOUCHSTONE TECHNOLOGY",
		Date:    "05/07/2001",
	},
	{
		ID:      "TSY",
		Company: "TOUCHSYSTEMS",
		Date:    "01/18/2008",
	},
	{
		ID:      "TWK",
		Company: "TOWITOKO ELECTRONICS GMBH",
		Date:    "04/14/1998",
	},
	{
		ID:      "KPT",
		Company: "TPK HOLDING CO., LTD",
		Date:    "08/16/2016",
	},
	{
		ID:      "CSB",
		Company: "TRANSTEX SA",
		Date:    "03/15/2001",
	},
	{
		ID:      "TST",
		Company: "TRANSTREAM INC",
		Date:    "04/29/1997",
	},
	{
		ID:      "TSV",
		Company: "TRANSVIDEO",
		Date:    "05/04/2010",
	},
	{
		ID:      "TRP",
		Company: "TRAPEZE GROUP",
		Date:    "02/28/2017",
	},
	{
		ID:      "TRE",
		Company: "TREMETRICS",
		Date:    "04/24/1997",
	},
	{
		ID:      "RDM",
		Company: "TREMON ENTERPRISES COMPANY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "TTI",
		Company: "TRENTON TERMINALS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "TRX",
		Company: "TREX ENTERPRISES",
		Date:    "02/21/2000",
	},
	{
		ID:      "TDS",
		Company: "TRI-DATA SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "OZO",
		Company: "TRIBE COMPUTER WORKS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "TRI",
		Company: "TRICORD SYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "TTY",
		Company: "TRIDELITY DISPLAY SOLUTIONS GMBH",
		Date:    "07/19/2010",
	},
	{
		ID:      "TRD",
		Company: "TRIDENT MICROSYSTEM INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "TMS",
		Company: "TRIDENT MICROSYSTEMS LTD",
		Date:    "07/15/2002",
	},
	{
		ID:      "TGI",
		Company: "TRIGEM COMPUTER INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "TGM",
		Company: "TRIGEM COMPUTER,INC.",
		Date:    "07/05/2001",
	},
	{
		ID:      "TIC",
		Company: "TRIGEM KINFOCOMM",
		Date:    "02/26/2003",
	},
	{
		ID:      "TRC",
		Company: "TRIOC AB",
		Date:    "01/13/2000",
	},
	{
		ID:      "TBB",
		Company: "TRIPLE S ENGINEERING INC",
		Date:    "09/26/1997",
	},
	{
		ID:      "TRT",
		Company: "TRITEC ELECTRONIC AG",
		Date:    "01/11/2012",
	},
	{
		ID:      "TRA",
		Company: "TRITECH MICROELECTRONICS INTERNATIONAL",
		Date:    "01/24/1997",
	},
	{
		ID:      "TRB",
		Company: "TRIUMPH BOARD A.S.",
		Date:    "09/27/2013",
	},
	{
		ID:      "TRV",
		Company: "TRIVISIO PROTOTYPING GMBH",
		Date:    "11/18/2011",
	},
	{
		ID:      "TXL",
		Company: "TRIXEL LTD",
		Date:    "08/10/2000",
	},
	{
		ID:      "MKV",
		Company: "TRTHEIM TECHNOLOGY",
		Date:    "03/17/1997",
	},
	{
		ID:      "TVI",
		Company: "TRUEVISION",
		Date:    "11/29/1996",
	},
	{
		ID:      "TTE",
		Company: "TTE, INC.",
		Date:    "01/18/2005",
	},
	{
		ID:      "TCI",
		Company: "TULIP COMPUTERS INT'L B.V.",
		Date:    "11/29/1996",
	},
	{
		ID:      "TBC",
		Company: "TURBO COMMUNICATION, INC",
		Date:    "09/01/1998",
	},
	{
		ID:      "TBS",
		Company: "TURTLE BEACH SYSTEM",
		Date:    "11/29/1996",
	},
	{
		ID:      "TUT",
		Company: "TUT SYSTEMS",
		Date:    "08/19/1997",
	},
	{
		ID:      "TVR",
		Company: "TV INTERACTIVE CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "TVO",
		Company: "TV ONE LTD",
		Date:    "09/02/2008",
	},
	{
		ID:      "TVV",
		Company: "TV1 GMBH",
		Date:    "02/06/2012",
	},
	{
		ID:      "TVS",
		Company: "TVS ELECTRONICS LIMITED",
		Date:    "05/20/2008",
	},
	{
		ID:      "TWH",
		Company: "TWINHEAD INTERNATIONAL CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "TYN",
		Company: "TYAN COMPUTER CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "USE",
		Company: "U. S. ELECTRONICS INC.",
		Date:    "10/28/2013",
	},
	{
		ID:      "USD",
		Company: "U.S. DIGITAL CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "NRL",
		Company: "U.S. NAVAL RESEARCH LAB",
		Date:    "11/29/1996",
	},
	{
		ID:      "TSP",
		Company: "U.S. NAVY",
		Date:    "10/17/2002",
	},
	{
		ID:      "USR",
		Company: "U.S. ROBOTICS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "UBL",
		Company: "UBINETICS LTD.",
		Date:    "05/23/2002",
	},
	{
		ID:      "UJR",
		Company: "UEDA JAPAN RADIO CO., LTD.",
		Date:    "07/09/2003",
	},
	{
		ID:      "PRP",
		Company: "UEFI FORUM",
		Date:    "02/03/2016",
	},
	{
		ID:      "UFO",
		Company: "UFO SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "UAS",
		Company: "ULTIMA ASSOCIATES PTE LTD",
		Date:    "01/02/1997",
	},
	{
		ID:      "UEC",
		Company: "ULTIMA ELECTRONICS CORPORATION",
		Date:    "09/01/1998",
	},
	{
		ID:      "UMT",
		Company: "ULTIMACHINE",
		Date:    "08/11/2016",
	},
	{
		ID:      "ULT",
		Company: "ULTRA NETWORK TECH",
		Date:    "11/29/1996",
	},
	{
		ID:      "UMG",
		Company: "UMEZAWA GIKEN CO.,LTD",
		Date:    "04/10/2008",
	},
	{
		ID:      "UBI",
		Company: "UNGERMANN-BASS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "WKH",
		Company: "UNI-TAKE INT'L INC.",
		Date:    "06/17/2002",
	},
	{
		ID:      "UNY",
		Company: "UNICATE",
		Date:    "07/21/1998",
	},
	{
		ID:      "UTC",
		Company: "UNICOMPUTE TECHNOLOGY CO., LTD.",
		Date:    "10/19/2020",
	},
	{
		ID:      "UDN",
		Company: "UNIDEN CORPORATION",
		Date:    "10/18/2004",
	},
	{
		ID:      "UIC",
		Company: "UNIFORM INDUSTRIAL CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "UNI",
		Company: "UNIFORM INDUSTRY CORP.",
		Date:    "11/06/2001",
	},
	{
		ID:      "UFG",
		Company: "UNIGRAF-USA",
		Date:    "10/09/2008",
	},
	{
		ID:      "UNB",
		Company: "UNISYS CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "UNC",
		Company: "UNISYS CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "UNM",
		Company: "UNISYS CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "UNO",
		Company: "UNISYS CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "UNS",
		Company: "UNISYS CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "UNT",
		Company: "UNISYS CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "UNA",
		Company: "UNISYS DSD",
		Date:    "11/29/1996",
	},
	{
		ID:      "UMC",
		Company: "UNITED MICROELECTR CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "UNP",
		Company: "UNITOP",
		Date:    "11/06/2001",
	},
	{
		ID:      "UEI",
		Company: "UNIVERSAL ELECTRONICS INC",
		Date:    "08/20/1997",
	},
	{
		ID:      "UET",
		Company: "UNIVERSAL EMPOWERING TECHNOLOGIES",
		Date:    "09/26/1997",
	},
	{
		ID:      "UMM",
		Company: "UNIVERSAL MULTIMEDIA",
		Date:    "10/08/2001",
	},
	{
		ID:      "USI",
		Company: "UNIVERSAL SCIENTIFIC INDUSTRIAL CO., LTD.",
		Date:    "11/04/2003",
	},
	{
		ID:      "JGD",
		Company: "UNIVERSITY COLLEGE",
		Date:    "11/29/1996",
	},
	{
		ID:      "UWC",
		Company: "UNIWILL COMPUTER CORP.",
		Date:    "04/16/2004",
	},
	{
		ID:      "UTD",
		Company: "UP TO DATE TECH",
		Date:    "11/29/1996",
	},
	{
		ID:      "UPP",
		Company: "UPPI",
		Date:    "04/14/1998",
	},
	{
		ID:      "RUP",
		Company: "UPS MANUFACTORING S.R.L.",
		Date:    "03/15/2001",
	},
	{
		ID:      "ASD",
		Company: "USC INFORMATION SCIENCES INSTITUTE",
		Date:    "04/08/1997",
	},
	{
		ID:      "USA",
		Company: "UTIMACO SAFEWARE AG",
		Date:    "05/04/1998",
	},
	{
		ID:      "VSR",
		Company: "V-STAR ELECTRONICS INC.",
		Date:    "02/21/2000",
	},
	{
		ID:      "VAT",
		Company: "VADATECH INC",
		Date:    "07/09/2018",
	},
	{
		ID:      "VAD",
		Company: "VADDIO, LLC",
		Date:    "11/30/2012",
	},
	{
		ID:      "VDM",
		Company: "VADEM",
		Date:    "11/29/1996",
	},
	{
		ID:      "VAI",
		Company: "VAIO CORPORATION",
		Date:    "04/18/2014",
	},
	{
		ID:      "VAL",
		Company: "VALENCE COMPUTING CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "VBT",
		Company: "VALLEY BOARD LTDA",
		Date:    "03/15/2001",
	},
	{
		ID:      "VLB",
		Company: "VALLEYBOARD LTDA.",
		Date:    "04/05/1998",
	},
	{
		ID:      "VLV",
		Company: "VALVE CORPORATION",
		Date:    "03/06/2013",
	},
	{
		ID:      "ITI",
		Company: "VANERUM GROUP",
		Date:    "10/01/2013",
	},
	{
		ID:      "VAR",
		Company: "VARIAN AUSTRALIA PTY LTD",
		Date:    "04/19/2000",
	},
	{
		ID:      "VRT",
		Company: "VARJO TECHNOLOGIES",
		Date:    "11/17/2017",
	},
	{
		ID:      "VTV",
		Company: "VATIV TECHNOLOGIES",
		Date:    "04/12/2006",
	},
	{
		ID:      "VBR",
		Company: "VBRICK SYSTEMS INC.",
		Date:    "08/19/2009",
	},
	{
		ID:      "VCX",
		Company: "VCONEX",
		Date:    "06/15/2005",
	},
	{
		ID:      "VDC",
		Company: "VDC DISPLAY SYSTEMS",
		Date:    "04/29/2009",
	},
	{
		ID:      "VEC",
		Company: "VECTOR INFORMATIK GMBH",
		Date:    "09/10/1997",
	},
	{
		ID:      "VCM",
		Company: "VECTOR MAGNETICS, LLC",
		Date:    "04/12/2006",
	},
	{
		ID:      "VEK",
		Company: "VEKTREX",
		Date:    "12/13/1996",
	},
	{
		ID:      "VFI",
		Company: "VERIFONE INC",
		Date:    "05/29/1998",
	},
	{
		ID:      "VMI",
		Company: "VERMONT MICROSYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "VLC",
		Company: "VERSALOGIC CORPORATION",
		Date:    "05/25/2016",
	},
	{
		ID:      "VTX",
		Company: "VESTAX CORPORATION",
		Date:    "02/14/2012",
	},
	{
		ID:      "VES",
		Company: "VESTEL ELEKTRONIK SANAYI VE TICARET A. S.",
		Date:    "09/19/1997",
	},
	{
		ID:      "VIM",
		Company: "VIA MONS LTD.",
		Date:    "08/29/2012",
	},
	{
		ID:      "VIA",
		Company: "VIA TECH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "VCJ",
		Company: "VICTOR COMPANY OF JAPAN, LIMITED",
		Date:    "02/06/2009",
	},
	{
		ID:      "VDA",
		Company: "VICTOR DATA SYSTEMS",
		Date:    "05/24/2000",
	},
	{
		ID:      "VIC",
		Company: "VICTRON B.V.",
		Date:    "11/29/1996",
	},
	{
		ID:      "VDO",
		Company: "VIDEO & DISPLAY ORIENTED CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "URD",
		Company: "VIDEO COMPUTER S.P.A.",
		Date:    "02/24/1998",
	},
	{
		ID:      "JWD",
		Company: "VIDEO INTERNATIONAL INC.",
		Date:    "02/21/2000",
	},
	{
		ID:      "VPI",
		Company: "VIDEO PRODUCTS INC",
		Date:    "05/04/2010",
	},
	{
		ID:      "VLT",
		Company: "VIDEOLAN TECHNOLOGIES",
		Date:    "10/17/1997",
	},
	{
		ID:      "VSI",
		Company: "VIDEOSERVER",
		Date:    "06/25/1997",
	},
	{
		ID:      "VTB",
		Company: "VIDEOTECHNIK BREITHAUPT",
		Date:    "07/23/2013",
	},
	{
		ID:      "VTN",
		Company: "VIDEOTRON CORP.",
		Date:    "05/04/2010",
	},
	{
		ID:      "VDS",
		Company: "VIDISYS GMBH & COMPANY",
		Date:    "11/29/1996",
	},
	{
		ID:      "VDT",
		Company: "VIDITEC, INC.",
		Date:    "11/08/1999",
	},
	{
		ID:      "VSC",
		Company: "VIEWSONIC CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "VTK",
		Company: "VIEWTECK CO., LTD.",
		Date:    "10/08/2001",
	},
	{
		ID:      "VIK",
		Company: "VIKING CONNECTORS",
		Date:    "11/29/1996",
	},
	{
		ID:      "VNC",
		Company: "VINCA CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "NHT",
		Company: "VINCI LABS",
		Date:    "03/03/2006",
	},
	{
		ID:      "VML",
		Company: "VINE MICROS LIMITED",
		Date:    "06/16/2004",
	},
	{
		ID:      "VIN",
		Company: "VINE MICROS LTD",
		Date:    "04/19/2000",
	},
	{
		ID:      "VCC",
		Company: "VIRTUAL COMPUTER CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "VRC",
		Company: "VIRTUAL RESOURCES CORPORATION",
		Date:    "11/29/1996",
	},
    {
		ID:      "VQ@",
		Company: "VISION QUEST",
		Date:    "10/26/2009",
	},
	{
		ID:      "VSP",
		Company: "VISION SYSTEMS GMBH",
		Date:    "11/29/1996",
	},
	{
		ID:      "VIS",
		Company: "VISIONEER",
		Date:    "11/29/1996",
	},
	{
		ID:      "VIT",
		Company: "VISITECH AS",
		Date:    "09/05/2006",
	},
	{
		ID:      "VLK",
		Company: "VISLINK INTERNATIONAL LTD",
		Date:    "08/27/2012",
	},
	{
		ID:      "VCI",
		Company: "VISTACOM INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "VIR",
		Company: "VISUAL INTERFACE, INC",
		Date:    "11/27/1998",
	},
	{
		ID:      "VTL",
		Company: "VIVID TECHNOLOGY PTE LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "VIZ",
		Company: "VIZIO, INC",
		Date:    "06/06/2012",
	},
	{
		ID:      "VTI",
		Company: "VLSI TECH INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "VMW",
		Company: "VMWARE INC.,",
		Date:    "10/18/2011",
	},
	{
		ID:      "VTG",
		Company: "VOICE TECHNOLOGIES GROUP INC",
		Date:    "04/24/1997",
	},
	{
		ID:      "GDT",
		Company: "VORTEX COMPUTERSYSTEME GMBH",
		Date:    "11/29/1996",
	},
	{
		ID:      "VPX",
		Company: "VPIXX TECHNOLOGIES INC.",
		Date:    "12/05/2013",
	},
	{
		ID:      "DSJ",
		Company: "VR TECHNOLOGY HOLDINGS LIMITED",
		Date:    "01/19/2017",
	},
	{
		ID:      "VRG",
		Company: "VRGINEERS, INC.",
		Date:    "09/07/2017",
	},
	{
		ID:      "VRM",
		Company: "VRMAGIC HOLDING AG",
		Date:    "04/12/2013",
	},
	{
		ID:      "TSW",
		Company: "VRSHOW TECHNOLOGY LIMITED",
		Date:    "03/29/2018",
	},
	{
		ID:      "VRS",
		Company: "VRSTUDIOS, INC.",
		Date:    "06/22/2017",
	},
	{
		ID:      "VTS",
		Company: "VTECH COMPUTERS LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "VTC",
		Company: "VTEL CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "VUT",
		Company: "VUTRIX (UK) LTD",
		Date:    "07/22/2003",
	},
	{
		ID:      "VWB",
		Company: "VWEB CORP.",
		Date:    "03/12/2004",
	},
    {
		ID:      "WEL ",
		Company: "W-DEV",
		Date:    "11/01/2010",
	},
	{
		ID:      "WAC",
		Company: "WACOM TECH",
		Date:    "11/29/1996",
	},
	{
		ID:      "JPW",
		Company: "WALLIS HAMILTON INDUSTRIES",
		Date:    "07/16/1999",
	},
	{
		ID:      "MLT",
		Company: "WANLIDA GROUP CO., LTD.",
		Date:    "04/24/2014",
	},
	{
		ID:      "WAL",
		Company: "WAVE ACCESS",
		Date:    "12/13/1996",
	},
	{
		ID:      "AWS",
		Company: "WAVE SYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "WVM",
		Company: "WAVE SYSTEMS CORPORATION",
		Date:    "12/05/1997",
	},
	{
		ID:      "WAV",
		Company: "WAVEPHORE",
		Date:    "11/29/1996",
	},
	{
		ID:      "SEL",
		Company: "WAY2CALL COMMUNICATIONS",
		Date:    "03/20/1997",
	},
	{
		ID:      "WBS",
		Company: "WB SYSTEMTECHNIK GMBH",
		Date:    "09/08/1997",
	},
	{
		ID:      "WPI",
		Company: "WEARNES PERIPHERALS INTERNATIONAL (PTE) LTD",
		Date:    "03/31/1998",
	},
	{
		ID:      "WTK",
		Company: "WEARNES THAKRAL PTE",
		Date:    "11/29/1996",
	},
	{
		ID:      "WEB",
		Company: "WEBGEAR INC",
		Date:    "01/30/1998",
	},
	{
		ID:      "WMO",
		Company: "WESTERMO TELEINDUSTRI AB",
		Date:    "01/13/2000",
	},
	{
		ID:      "WDC",
		Company: "WESTERN DIGITAL",
		Date:    "11/29/1996",
	},
	{
		ID:      "WDE",
		Company: "WESTINGHOUSE DIGITAL ELECTRONICS",
		Date:    "05/23/2003",
	},
	{
		ID:      "WEY",
		Company: "WEY DESIGN AG",
		Date:    "10/18/2004",
	},
	{
		ID:      "WHI",
		Company: "WHISTLE COMMUNICATIONS",
		Date:    "10/24/1998",
	},
	{
		ID:      "WLD",
		Company: "WILDFIRE COMMUNICATIONS INC",
		Date:    "02/13/1997",
	},
	{
		ID:      "WNI",
		Company: "WILLNET INC.",
		Date:    "04/19/2000",
	},
	{
		ID:      "WEC",
		Company: "WINBOND ELECTRONICS CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "WMT",
		Company: "WINMATE COMMUNICATION INC",
		Date:    "03/15/2001",
	},
	{
		ID:      "WNV",
		Company: "WINNOV L.P.",
		Date:    "03/07/1997",
	},
	{
		ID:      "WRC",
		Company: "WINRADIO COMMUNICATIONS",
		Date:    "09/11/1997",
	},
	{
		ID:      "WIN",
		Company: "WINTOP TECHNOLOGY INC",
		Date:    "12/29/1996",
	},
	{
		ID:      "WWP",
		Company: "WIPOTEC WIEGE- UND POSITIONIERSYSTEME GMBH",
		Date:    "04/08/2014",
	},
	{
		ID:      "WIL",
		Company: "WIPRO INFORMATION TECHNOLOGY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "WIP",
		Company: "WIPRO INFOTECH",
		Date:    "01/09/2004",
	},
	{
		ID:      "WSP",
		Company: "WIRELESS AND SMART PRODUCTS INC.",
		Date:    "03/20/1999",
	},
	{
		ID:      "WCI",
		Company: "WISECOM INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "WST",
		Company: "WISTRON CORPORATION",
		Date:    "09/03/2010",
	},
	{
		ID:      "WLF",
		Company: "WOLF ADVANCED TECHNOLOGY",
		Date:    "10/22/2019",
	},
	{
		ID:      "WML",
		Company: "WOLFSON MICROELECTRONICS LTD",
		Date:    "07/30/1997",
	},
	{
		ID:      "WVV",
		Company: "WOLFVISION GMBH",
		Date:    "09/18/2012",
	},
	{
		ID:      "WCS",
		Company: "WOODWIND COMMUNICATIONS SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "WYT",
		Company: "WOOYOUNG IMAGE & INFORMATION CO.,LTD.",
		Date:    "01/18/2008",
	},
	{
		ID:      "WTI",
		Company: "WORKSTATION TECH",
		Date:    "11/29/1996",
	},
	{
		ID:      "WWV",
		Company: "WORLD WIDE VIDEO, INC.",
		Date:    "10/24/1998",
	},
	{
		ID:      "WXT",
		Company: "WOXTER TECHNOLOGY CO. LTD",
		Date:    "09/03/2010",
	},
	{
		ID:      "WYR",
		Company: "WYRESTORM TECHNOLOGIES LLC",
		Date:    "09/05/2018",
	},
	{
		ID:      "XTN",
		Company: "X-10 (USA) INC",
		Date:    "02/24/1997",
	},
	{
		ID:      "XTE",
		Company: "X2E GMBH",
		Date:    "09/23/2009",
	},
	{
		ID:      "XAC",
		Company: "XAC AUTOMATION CORP",
		Date:    "02/22/1999",
	},
	{
		ID:      "XDM",
		Company: "XDM LTD.",
		Date:    "11/22/2010",
	},
	{
		ID:      "MAD",
		Company: "XEDIA CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "XLX",
		Company: "XILINX, INC.",
		Date:    "08/01/2007",
	},
	{
		ID:      "XIN",
		Company: "XINEX NETWORKS INC",
		Date:    "02/07/1997",
	},
	{
		ID:      "XIO",
		Company: "XIOTECH CORPORATION",
		Date:    "05/29/1998",
	},
	{
		ID:      "XRC",
		Company: "XIRCOM INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "XIR",
		Company: "XIROCM INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "XIT",
		Company: "XITEL PTY LTD",
		Date:    "11/29/1996",
	},
	{
		ID:      "XNT",
		Company: "XN TECHNOLOGIES, INC.",
		Date:    "07/14/2003",
	},
	{
		ID:      "UHB",
		Company: "XOCECO",
		Date:    "11/27/1998",
	},
	{
		ID:      "XRO",
		Company: "XORO ELECTRONICS (CHENGDU) LIMITED",
		Date:    "05/23/2005",
	},
	{
		ID:      "XST",
		Company: "XS TECHNOLOGIES INC",
		Date:    "01/20/1998",
	},
	{
		ID:      "XSN",
		Company: "XSCREEN AS",
		Date:    "02/14/2006",
	},
	{
		ID:      "XSY",
		Company: "XSYS",
		Date:    "04/23/1998",
	},
	{
		ID:      "XYC",
		Company: "XYCOTEC COMPUTER GMBH",
		Date:    "09/03/2002",
	},
	{
		ID:      "YED",
		Company: "Y-E DATA INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "YMH",
		Company: "YAMAHA CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "BUF",
		Company: "YASUHIKO SHIRAI MELCO INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "YHQ",
		Company: "YOKOGAWA ELECTRIC CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "TPZ",
		Company: "YPOAZ SYSTEMS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ZMZ",
		Company: "Z MICROSYSTEMS",
		Date:    "08/10/2005",
	},
	{
		ID:      "ZTT",
		Company: "Z3 TECHNOLOGY",
		Date:    "12/14/2010",
	},
	{
		ID:      "ZMT",
		Company: "ZALMAN TECH CO., LTD.",
		Date:    "05/07/2007",
	},
	{
		ID:      "ZAN",
		Company: "ZANDAR TECHNOLOGIES PLC",
		Date:    "12/03/2003",
	},
	{
		ID:      "ZBX",
		Company: "ZEBAX TECHNOLOGIES",
		Date:    "10/16/2015",
	},
	{
		ID:      "ZBR",
		Company: "ZEBRA TECHNOLOGIES INTERNATIONAL, LLC",
		Date:    "09/15/2003",
	},
	{
		ID:      "ZAZ",
		Company: "ZEEVEE, INC.",
		Date:    "01/18/2008",
	},
	{
		ID:      "ZAX",
		Company: "ZEFIRO ACOUSTICS",
		Date:    "11/29/1996",
	},
	{
		ID:      "ZCT",
		Company: "ZEITCONTROL CARDSYSTEMS GMBH",
		Date:    "01/20/1999",
	},
	{
		ID:      "ZEN",
		Company: "ZENIC INC.",
		Date:    "04/17/2015",
	},
	{
		ID:      "ZDS",
		Company: "ZENITH DATA SYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "ZGT",
		Company: "ZENITH DATA SYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "ZSE",
		Company: "ZENITH DATA SYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "ZNI",
		Company: "ZETINET INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "TLE",
		Company: "ZHEJIANG TIANLE DIGITAL ELECTRIC CO., LTD.",
		Date:    "01/17/2014",
	},
	{
		ID:      "RSR",
		Company: "ZHONG SHAN CITY RICHSOUND ELECTRONIC INDUSTRIAL LTD.",
		Date:    "01/27/2015",
	},
	{
		ID:      "ZNX",
		Company: "ZNYX ADV. SYSTEMS",
		Date:    "11/29/1996",
	},
	{
		ID:      "ZTI",
		Company: "ZOOM TELEPHONICS INC",
		Date:    "11/29/1996",
	},
	{
		ID:      "ZRN",
		Company: "ZORAN CORPORATION",
		Date:    "03/31/2005",
	},
	{
		ID:      "ZOW",
		Company: "ZOWIE INTERTAINMENT, INC",
		Date:    "02/22/1999",
	},
	{
		ID:      "ZTM",
		Company: "ZT GROUP INT'L INC.",
		Date:    "06/14/2007",
	},
	{
		ID:      "ZTE",
		Company: "ZTE CORPORATION",
		Date:    "09/03/2010",
	},
	{
		ID:      "SIX",
		Company: "ZUNIQ DATA CORPORATION",
		Date:    "11/29/1996",
	},
	{
		ID:      "ZYD",
		Company: "ZYDACRON INC",
		Date:    "04/10/1997",
	},
	{
		ID:      "ZTC",
		Company: "ZYDAS TECHNOLOGY CORPORATION",
		Date:    "05/24/2000",
	},
	{
		ID:      "ZYP",
		Company: "ZYPCOM INC",
		Date:    "03/19/1997",
	},
	{
		ID:      "ZYT",
		Company: "ZYTEX COMPUTERS",
		Date:    "11/29/1996",
	},
	{
		ID:      "HPA",
		Company: "ZYTOR COMMUNICATIONS",
		Date:    "07/02/2010",
	},
	{
		ID:      "ZYX",
		Company: "ZYXEL",
		Date:    "11/29/1996",
	}
]
export default pnpLookup;