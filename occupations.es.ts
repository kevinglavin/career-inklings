import { Occupation } from './types';
import { Lang } from './i18n';

export type OccText = { title: string; description: string; tasks: string[]; workActivities: string[] };

// Verified neutral-Latin-American Spanish translations of the 60 occupations, keyed by id.
// Produced by the inklings-spanish translate+verify workflow. Empty entries fall back to English.
export const OCCUPATIONS_ES: Record<string, OccText> = {
  "r1": {
    "title": "Chef",
    "description": "Dirige y participa en la preparación y cocción de alimentos, planifica menús y supervisa al personal de cocina.",
    "tasks": [
      "Planificar menús y la preparación de alimentos",
      "Dirigir al personal de cocina y de preparación de alimentos",
      "Inspeccionar los insumos, el equipo y las áreas de trabajo para verificar su limpieza",
      "Vigilar la calidad de los alimentos y el control de las porciones"
    ],
    "workActivities": [
      "Pensamiento creativo — Crear nuevas recetas y menús",
      "Organización y planificación — Coordinar las operaciones de la cocina y los horarios del personal",
      "Realizar actividad física — Preparar y cocinar alimentos en ambientes de ritmo acelerado"
    ]
  },
  "r2": {
    "title": "Bombero",
    "description": "Controla y extingue incendios, protege la vida y los bienes, y realiza labores de rescate.",
    "tasks": [
      "Responder a alarmas de incendio y llamadas de emergencia",
      "Rescatar a víctimas de edificios en llamas o accidentes",
      "Manejar el equipo y los vehículos de extinción de incendios",
      "Brindar primeros auxilios y RCP a personas lesionadas"
    ],
    "workActivities": [
      "Realizar actividad física — Cargar equipo y rescatar personas",
      "Tomar decisiones — Evaluar el peligro y elegir estrategias de rescate",
      "Ayudar a los demás — Brindar atención médica de emergencia y educación sobre seguridad en la comunidad"
    ]
  },
  "r3": {
    "title": "Naturalista de Parques",
    "description": "Planifica y ofrece programas para informar al público sobre áreas naturales como parques y bosques.",
    "tasks": [
      "Desarrollar y presentar programas de educación sobre la naturaleza",
      "Realizar excursiones y caminatas guiadas por la naturaleza",
      "Mantener senderos, exhibiciones e instalaciones naturales",
      "Monitorear las poblaciones de vida silvestre y los recursos naturales"
    ],
    "workActivities": [
      "Comunicar — Enseñar a los visitantes sobre los ecosistemas y la conservación",
      "Realizar actividad física — Mantener senderos y hacer trabajo de campo",
      "Obtener información — Investigar la flora, la fauna y la ecología local"
    ]
  },
  "r4": {
    "title": "Piloto",
    "description": "Navega y pilota aviones o helicópteros para transportar pasajeros o carga de forma segura.",
    "tasks": [
      "Revisar la aeronave antes de los vuelos para garantizar la seguridad",
      "Vigilar los instrumentos y las condiciones del clima durante los vuelos",
      "Comunicarse con el control de tráfico aéreo",
      "Navegar y manejar los controles de la aeronave"
    ],
    "workActivities": [
      "Controlar máquinas — Manejar sistemas e instrumentos de vuelo complejos",
      "Tomar decisiones — Responder a los cambios del clima y a las emergencias",
      "Obtener información — Monitorear los instrumentos de vuelo, el combustible y los datos del clima"
    ]
  },
  "r5": {
    "title": "Oficial de Policía",
    "description": "Mantiene el orden, hace cumplir las leyes y protege a las personas y los bienes en las comunidades.",
    "tasks": [
      "Patrullar las zonas asignadas para mantener la seguridad pública",
      "Responder a llamadas de emergencia y de otro tipo",
      "Investigar delitos y recolectar evidencia",
      "Redactar informes detallados de incidentes y arrestos"
    ],
    "workActivities": [
      "Resolver conflictos — Mediar en disputas y mantener el orden público",
      "Tomar decisiones — Evaluar situaciones para determinar la acción apropiada",
      "Comunicar — Entrevistar a testigos y redactar informes de incidentes"
    ]
  },
  "r6": {
    "title": "Conductor de Camión",
    "description": "Conduce camiones pesados para transportar bienes y materiales a largas distancias.",
    "tasks": [
      "Conducir camiones por rutas establecidas",
      "Cargar y descargar la mercancía o coordinar su carga",
      "Inspeccionar los vehículos en busca de problemas mecánicos antes de los viajes",
      "Llevar registros de las horas de conducción y de la entrega de la carga"
    ],
    "workActivities": [
      "Operar vehículos — Conducir y maniobrar camiones grandes de forma segura",
      "Inspeccionar equipo — Revisar los vehículos y la carga para cumplir con las normas de seguridad",
      "Documentar información — Mantener registros precisos de entregas y de conducción"
    ]
  },
  "r7": {
    "title": "Carpintero",
    "description": "Construye, instala y repara estructuras y accesorios hechos de madera y otros materiales.",
    "tasks": [
      "Medir y cortar madera u otros materiales según las especificaciones",
      "Construir estructuras como paredes, pisos y marcos de puertas",
      "Instalar elementos como gabinetes, revestimientos y molduras",
      "Leer e interpretar planos y proyectos de construcción"
    ],
    "workActivities": [
      "Manipular objetos — Cortar, dar forma y ensamblar madera y materiales",
      "Inspeccionar equipo — Asegurar que las estructuras cumplan con las normas de seguridad y construcción",
      "Obtener información — Leer planos y especificaciones del proyecto"
    ]
  },
  "r8": {
    "title": "Electricista",
    "description": "Instala, mantiene y repara cableado, equipos y accesorios eléctricos.",
    "tasks": [
      "Instalar y mantener sistemas eléctricos en los edificios",
      "Inspeccionar componentes eléctricos como transformadores e interruptores",
      "Diagnosticar equipos y sistemas que funcionan mal",
      "Leer planos y diagramas técnicos"
    ],
    "workActivities": [
      "Reparar — Arreglar y mantener sistemas eléctricos y cableado",
      "Inspeccionar equipo — Probar circuitos para garantizar la seguridad y el buen funcionamiento",
      "Obtener información — Leer planos técnicos y normas eléctricas"
    ]
  },
  "r9": {
    "title": "Agricultor",
    "description": "Planifica, dirige y coordina las labores agrícolas para cultivar productos o criar ganado.",
    "tasks": [
      "Sembrar, cultivar y cosechar los cultivos",
      "Monitorear la salud de los cultivos y los animales",
      "Manejar y dar mantenimiento a la maquinaria y el equipo agrícola",
      "Administrar las operaciones del negocio, incluidos los presupuestos y la compra de insumos"
    ],
    "workActivities": [
      "Realizar actividad física — Sembrar, cuidar y cosechar los cultivos",
      "Tomar decisiones — Planificar los calendarios de siembra según el clima y los mercados",
      "Controlar máquinas — Operar tractores, cosechadoras y sistemas de riego"
    ]
  },
  "r10": {
    "title": "Mecánico",
    "description": "Diagnostica, ajusta, repara o reacondiciona automóviles y camionetas ligeras.",
    "tasks": [
      "Diagnosticar problemas del vehículo usando equipo de diagnóstico",
      "Reparar o reemplazar piezas desgastadas o rotas",
      "Realizar mantenimiento de rutina como cambios de aceite y rotación de llantas",
      "Probar los vehículos en marcha para verificar las reparaciones"
    ],
    "workActivities": [
      "Reparar — Arreglar motores, frenos, transmisiones y otros sistemas del vehículo",
      "Inspeccionar equipo — Usar herramientas de diagnóstico para identificar problemas mecánicos",
      "Actualizar conocimientos — Mantenerse al día con las nuevas tecnologías de los vehículos"
    ]
  },
  "i1": {
    "title": "Biólogo/a",
    "description": "Estudia a los seres vivos y la relación que tienen con su entorno.",
    "tasks": [
      "Realizar investigaciones sobre los seres vivos",
      "Recolectar y analizar datos y muestras biológicas",
      "Escribir artículos e informes de investigación",
      "Diseñar y realizar experimentos en laboratorios o en el campo"
    ],
    "workActivities": [
      "Analizar datos — Estudiar muestras e interpretar los resultados de las investigaciones",
      "Documentar información — Redactar informes de investigación y artículos científicos",
      "Pensar de forma creativa — Diseñar experimentos para poner a prueba hipótesis"
    ]
  },
  "i2": {
    "title": "Químico/a",
    "description": "Realiza investigaciones y experimentos para desarrollar nuevos productos y procesos.",
    "tasks": [
      "Analizar sustancias para determinar su composición",
      "Desarrollar nuevos productos y procesos químicos",
      "Realizar pruebas y control de calidad de los materiales",
      "Preparar informes y presentar los resultados de las investigaciones"
    ],
    "workActivities": [
      "Analizar datos — Interpretar los resultados de pruebas químicas y datos experimentales",
      "Procesar información — Usar métodos científicos para resolver problemas químicos",
      "Documentar información — Registrar resultados de pruebas y redactar informes técnicos"
    ]
  },
  "i3": {
    "title": "Programador/a de computadoras",
    "description": "Crea, modifica y prueba código y scripts que permiten que funcionen las aplicaciones de computadora.",
    "tasks": [
      "Escribir y probar código para aplicaciones de software",
      "Depurar y solucionar errores en programas existentes",
      "Actualizar y dar mantenimiento a los sistemas de software",
      "Colaborar con desarrolladores de software en el diseño y la arquitectura"
    ],
    "workActivities": [
      "Trabajar con computadoras — Escribir, probar y depurar el código de los programas",
      "Analizar datos — Identificar errores y optimizar el rendimiento del software",
      "Pensar de forma creativa — Diseñar soluciones para problemas técnicos complejos"
    ]
  },
  "i4": {
    "title": "Economista",
    "description": "Estudia cómo la sociedad distribuye recursos como la tierra, el trabajo y las materias primas.",
    "tasks": [
      "Investigar temas económicos y analizar datos",
      "Desarrollar modelos y pronósticos económicos",
      "Asesorar a gobiernos y empresas en materia de política económica",
      "Escribir informes y presentar análisis económicos"
    ],
    "workActivities": [
      "Analizar datos — Estudiar tendencias, datos y estadísticas económicas",
      "Procesar información — Crear modelos para pronosticar la actividad económica",
      "Comunicar — Presentar hallazgos y recomendaciones de política"
    ]
  },
  "i5": {
    "title": "Geólogo/a",
    "description": "Estudia la composición, la estructura y la historia de la Tierra y sus procesos.",
    "tasks": [
      "Analizar muestras de rocas, minerales y fósiles",
      "Realizar estudios de campo y levantamientos geológicos",
      "Elaborar mapas e informes geológicos",
      "Evaluar sitios para la extracción de recursos naturales o la construcción"
    ],
    "workActivities": [
      "Obtener información — Recolectar datos y muestras geológicas en el campo",
      "Analizar datos — Interpretar mapas geológicos y resultados de levantamientos",
      "Documentar información — Redactar informes sobre los hallazgos y evaluaciones"
    ]
  },
  "i6": {
    "title": "Matemático/a",
    "description": "Realiza investigaciones para desarrollar y comprender principios matemáticos y aplica técnicas para resolver problemas.",
    "tasks": [
      "Desarrollar modelos matemáticos para resolver problemas prácticos",
      "Aplicar teorías matemáticas a temas científicos y de ingeniería",
      "Realizar investigaciones en matemáticas fundamentales",
      "Analizar datos usando métodos estadísticos y computacionales"
    ],
    "workActivities": [
      "Analizar datos — Usar matemáticas avanzadas para interpretar datos y resolver problemas",
      "Procesar información — Desarrollar fórmulas y modelos matemáticos",
      "Pensar de forma creativa — Encontrar enfoques novedosos para problemas cuantitativos complejos"
    ]
  },
  "i7": {
    "title": "Científico/a médico/a",
    "description": "Realiza investigaciones para mejorar la salud humana mediante la comprensión de enfermedades y tratamientos.",
    "tasks": [
      "Planificar y realizar estudios de investigación médica",
      "Recolectar y analizar datos de ensayos clínicos",
      "Desarrollar nuevos medicamentos, tratamientos o dispositivos médicos",
      "Escribir propuestas de investigación y publicaciones científicas"
    ],
    "workActivities": [
      "Analizar datos — Interpretar datos de ensayos clínicos y resultados de investigaciones",
      "Obtener información — Revisar la literatura médica y los hallazgos de investigaciones",
      "Documentar información — Publicar investigaciones en revistas científicas"
    ]
  },
  "i8": {
    "title": "Farmacéutico/a",
    "description": "Dispensa medicamentos, asesora a los pacientes sobre su uso y garantiza una atención farmacéutica segura.",
    "tasks": [
      "Revisar y surtir recetas de medicamentos",
      "Asesorar a los pacientes sobre el uso correcto de los medicamentos y sus efectos secundarios",
      "Vigilar las terapias farmacológicas de los pacientes para detectar interacciones",
      "Colaborar con los médicos en los planes de tratamiento"
    ],
    "workActivities": [
      "Procesar información — Revisar las recetas para verificar su exactitud y posibles interacciones",
      "Comunicar — Orientar a los pacientes sobre los medicamentos y la salud",
      "Actualizar conocimientos — Mantenerte al día con los nuevos medicamentos y la investigación farmacéutica"
    ]
  },
  "i9": {
    "title": "Psicólogo/a",
    "description": "Estudia el comportamiento humano y los procesos mentales, y ayuda a las personas a manejar desafíos conductuales y emocionales.",
    "tasks": [
      "Realizar evaluaciones psicológicas y valoraciones",
      "Brindar servicios de terapia y consejería",
      "Diseñar y realizar estudios de investigación sobre el comportamiento",
      "Escribir informes y recomendaciones de tratamiento"
    ],
    "workActivities": [
      "Ayudar a los demás — Brindar terapia y apoyo emocional a los clientes",
      "Analizar datos — Interpretar pruebas psicológicas y resultados de evaluaciones",
      "Documentar información — Registrar notas de las sesiones y planes de tratamiento"
    ]
  },
  "i10": {
    "title": "Médico/a",
    "description": "Diagnostica y trata lesiones, enfermedades y trastornos en los pacientes.",
    "tasks": [
      "Examinar a los pacientes y diagnosticar afecciones médicas",
      "Recetar medicamentos y planes de tratamiento",
      "Solicitar e interpretar pruebas diagnósticas",
      "Orientar a los pacientes sobre el cuidado preventivo de la salud"
    ],
    "workActivities": [
      "Tomar decisiones — Diagnosticar afecciones y definir planes de tratamiento",
      "Ayudar a los demás — Brindar atención médica y orientación de salud a los pacientes",
      "Actualizar conocimientos — Mantenerte al día con la investigación médica y las mejores prácticas"
    ]
  },
  "a1": {
    "title": "Actor",
    "description": "Interpreta papeles en producciones de teatro, televisión, radio, video o cine para entretener y comunicar.",
    "tasks": [
      "Interpretar guiones y dar vida a personajes",
      "Ensayar líneas y escenas con el resto del elenco",
      "Hacer audiciones para conseguir papeles en producciones",
      "Colaborar con los directores en el desarrollo de los personajes"
    ],
    "workActivities": [
      "Pensamiento Creativo — Interpretar guiones y crear personajes",
      "Actuación — Decir tus líneas y hacer las acciones en el escenario o frente a la cámara",
      "Comunicación — Colaborar con directores, guionistas y otros actores"
    ]
  },
  "a2": {
    "title": "Profesor de Arte",
    "description": "Enseña a los estudiantes artes visuales, como el dibujo, la pintura y la escultura.",
    "tasks": [
      "Planear y dar clases y proyectos de arte",
      "Demostrar técnicas en distintos materiales artísticos",
      "Evaluar las obras de los estudiantes y darles retroalimentación",
      "Organizar exposiciones y muestras con los trabajos de los estudiantes"
    ],
    "workActivities": [
      "Enseñanza — Enseñar a los estudiantes técnicas artísticas e historia del arte",
      "Pensamiento Creativo — Diseñar clases y proyectos de arte atractivos",
      "Acompañamiento — Guiar a los estudiantes para que desarrollen sus habilidades artísticas"
    ]
  },
  "a3": {
    "title": "Bailarín",
    "description": "Interpreta bailes, normalmente acompañado de música, para entretener al público.",
    "tasks": [
      "Ensayar y presentar coreografías de baile",
      "Hacer audiciones para conseguir papeles en producciones",
      "Mantener la condición física y la flexibilidad",
      "Colaborar con los coreógrafos en nuevas rutinas"
    ],
    "workActivities": [
      "Actuación — Ejecutar coreografías de baile en el escenario",
      "Actividad Física — Entrenar y acondicionar tu cuerpo todos los días",
      "Pensamiento Creativo — Expresar emociones e historias a través del movimiento"
    ]
  },
  "a4": {
    "title": "Diseñador de Moda",
    "description": "Diseña ropa, accesorios y calzado a partir de las tendencias y de una visión creativa.",
    "tasks": [
      "Hacer bocetos de diseños y crear patrones para las prendas",
      "Elegir telas y materiales para la producción",
      "Supervisar la producción de muestras y productos finales",
      "Investigar las tendencias de moda actuales y las preferencias de los consumidores"
    ],
    "workActivities": [
      "Pensamiento Creativo — Idear diseños de ropa originales",
      "Búsqueda de Información — Investigar tendencias, telas y la demanda del mercado",
      "Comunicación — Presentar las colecciones a compradores y clientes"
    ]
  },
  "a5": {
    "title": "Director de Cine",
    "description": "Dirige y coordina todos los aspectos de una producción de cine, televisión o video.",
    "tasks": [
      "Interpretar guiones y guiar a los actores en sus actuaciones",
      "Coordinarse con los directores de fotografía, editores y el equipo de producción",
      "Tomar decisiones creativas sobre el estilo visual y el ritmo",
      "Supervisar la edición y el diseño de sonido en la posproducción"
    ],
    "workActivities": [
      "Guiar a Otros — Dirigir a los actores y al equipo de producción",
      "Pensamiento Creativo — Darle forma a la visión artística de una producción",
      "Organización — Manejar los horarios, los presupuestos y la logística de la producción"
    ]
  },
  "a6": {
    "title": "Diseñador Gráfico",
    "description": "Crea conceptos visuales con software para comunicar ideas que inspiran e informan a los consumidores.",
    "tasks": [
      "Diseñar gráficos para impresos, web y redes sociales",
      "Crear logos, materiales de marca y diseños de página",
      "Colaborar con los clientes para entender sus necesidades de diseño",
      "Usar software de diseño como Adobe Creative Suite"
    ],
    "workActivities": [
      "Pensamiento Creativo — Desarrollar conceptos y diseños visuales originales",
      "Trabajo con Computadoras — Usar software de diseño para crear arte digital",
      "Comunicación — Presentar los conceptos de diseño a clientes y equipos"
    ]
  },
  "a7": {
    "title": "Diseñador de Interiores",
    "description": "Planea, diseña y decora espacios interiores para que sean funcionales, seguros y agradables a la vista.",
    "tasks": [
      "Crear planes de diseño para espacios residenciales o comerciales",
      "Elegir materiales, muebles, colores e iluminación",
      "Coordinarse con contratistas y arquitectos",
      "Presentar propuestas de diseño y estimaciones de costos a los clientes"
    ],
    "workActivities": [
      "Pensamiento Creativo — Imaginar espacios interiores que sean bonitos y funcionales",
      "Comunicación — Presentar los planes de diseño y colaborar con los clientes",
      "Búsqueda de Información — Investigar materiales, normas y tendencias de diseño"
    ]
  },
  "a8": {
    "title": "Músico",
    "description": "Toca instrumentos musicales, canta o compone música para presentaciones en vivo o grabadas.",
    "tasks": [
      "Practicar y ensayar música con regularidad",
      "Presentarse ante el público en vivo o en sesiones de grabación",
      "Componer o arreglar piezas musicales",
      "Colaborar con otros músicos y productores"
    ],
    "workActivities": [
      "Actuación — Tocar instrumentos o cantar ante el público",
      "Pensamiento Creativo — Componer, arreglar e improvisar música",
      "Actividad Física — Practicar instrumentos durante largos periodos"
    ]
  },
  "a9": {
    "title": "Fotógrafo",
    "description": "Fotografía personas, lugares y eventos usando cámaras digitales o de película.",
    "tasks": [
      "Montar y ajustar la iluminación y el equipo",
      "Fotografiar sujetos en distintos entornos",
      "Editar y retocar imágenes digitales",
      "Promocionar tus servicios y manejar la relación con los clientes"
    ],
    "workActivities": [
      "Pensamiento Creativo — Componer las tomas y crear imágenes artísticas",
      "Trabajo con Computadoras — Editar y procesar fotografías digitales",
      "Comunicación — Trabajar con los clientes para capturar su visión"
    ]
  },
  "a10": {
    "title": "Escritor",
    "description": "Escribe contenido original como guiones, ensayos, novelas o artículos para distintos medios.",
    "tasks": [
      "Investigar temas y desarrollar ideas para historias",
      "Escribir, editar y revisar contenido para su publicación",
      "Reunirse con editores y clientes para hablar de los proyectos",
      "Adaptar el estilo de escritura a distintos públicos y formatos"
    ],
    "workActivities": [
      "Pensamiento Creativo — Generar ideas originales para historias y artículos",
      "Comunicación — Escribir con claridad para públicos y propósitos específicos",
      "Búsqueda de Información — Investigar los temas para asegurar precisión y profundidad"
    ]
  },
  "s1": {
    "title": "Consejero Escolar",
    "description": "Ayuda a los estudiantes a desarrollar habilidades académicas, profesionales y sociales mediante asesoría individual y grupal.",
    "tasks": [
      "Asesorar a los estudiantes en su planificación académica y profesional",
      "Brindar sesiones de orientación individuales y grupales",
      "Colaborar con docentes y familias en el desarrollo de los estudiantes",
      "Identificar y derivar a estudiantes que necesitan apoyo especializado"
    ],
    "workActivities": [
      "Ayudar a Otros — Acompañar a los estudiantes a superar retos personales y académicos",
      "Comunicar — Reunirte con estudiantes, familias y personal escolar",
      "Organizar — Planear programas de orientación y actividades de exploración profesional"
    ]
  },
  "s2": {
    "title": "Fisioterapeuta",
    "description": "Ayuda a personas lesionadas o enfermas a mejorar su movilidad y a manejar el dolor mediante ejercicio y terapia.",
    "tasks": [
      "Evaluar las capacidades y limitaciones físicas de los pacientes",
      "Diseñar e implementar planes de tratamiento",
      "Guiar a los pacientes en ejercicios terapéuticos",
      "Registrar el progreso del paciente y ajustar los tratamientos"
    ],
    "workActivities": [
      "Ayudar a Otros — Apoyar a los pacientes a recuperar movilidad y fuerza",
      "Tomar Decisiones — Diseñar planes de tratamiento personalizados",
      "Realizar Actividad Física — Mostrar y guiar los ejercicios"
    ]
  },
  "s3": {
    "title": "Trabajador Social",
    "description": "Ayuda a las personas a resolver y afrontar los problemas de su vida diaria y las conecta con recursos.",
    "tasks": [
      "Evaluar las necesidades del cliente y diseñar planes de servicio",
      "Conectar a los clientes con recursos y servicios de la comunidad",
      "Defender los derechos y el bienestar de los clientes",
      "Llevar registros y documentación de los casos"
    ],
    "workActivities": [
      "Ayudar a Otros — Apoyar a personas y familias en crisis",
      "Comunicar — Entrevistar a los clientes y coordinar con instituciones",
      "Resolver Conflictos — Mediar disputas y abogar por las poblaciones vulnerables"
    ]
  },
  "s4": {
    "title": "Fonoaudiólogo",
    "description": "Diagnostica y trata trastornos del habla, el lenguaje, la voz y la deglución en pacientes de todas las edades.",
    "tasks": [
      "Evaluar las habilidades de habla y lenguaje de los pacientes",
      "Diseñar planes de tratamiento personalizados",
      "Brindar terapia para mejorar las habilidades de comunicación",
      "Orientar a las familias sobre cómo apoyar el desarrollo del habla"
    ],
    "workActivities": [
      "Ayudar a Otros — Apoyar a los pacientes a mejorar sus habilidades de comunicación",
      "Tomar Decisiones — Diagnosticar trastornos y planear los tratamientos",
      "Documentar Información — Registrar las evaluaciones y el progreso del paciente"
    ]
  },
  "s5": {
    "title": "Consejero de Rehabilitación",
    "description": "Ayuda a personas con discapacidades físicas, mentales o emocionales a vivir de forma independiente y a conseguir empleo.",
    "tasks": [
      "Evaluar las capacidades, intereses y limitaciones de los clientes",
      "Diseñar planes de rehabilitación y fijar metas alcanzables",
      "Coordinar con empleadores para conseguir oportunidades de trabajo",
      "Conectar a los clientes con tecnología de apoyo y servicios"
    ],
    "workActivities": [
      "Ayudar a Otros — Apoyar a los clientes a desarrollar su independencia",
      "Comunicar — Coordinar con empleadores, médicos y familias",
      "Organizar — Manejar los casos y dar seguimiento al progreso de los clientes"
    ]
  },
  "s6": {
    "title": "Enfermero Titulado",
    "description": "Brinda y coordina la atención del paciente, le explica sus condiciones de salud y le ofrece apoyo emocional.",
    "tasks": [
      "Evaluar la salud del paciente y registrar sus signos vitales",
      "Administrar medicamentos y tratamientos",
      "Enseñar a los pacientes y sus familias a cuidar su salud",
      "Colaborar con los médicos en los planes de atención"
    ],
    "workActivities": [
      "Ayudar a Otros — Brindar atención directa y apoyo emocional al paciente",
      "Tomar Decisiones — Vigilar el estado del paciente y responder a los cambios",
      "Documentar Información — Mantener registros médicos precisos"
    ]
  },
  "s7": {
    "title": "Maestro (de Primaria)",
    "description": "Enseña a los estudiantes habilidades académicas, sociales y para la vida fundamentales en el nivel de primaria.",
    "tasks": [
      "Planear y dar clases de las materias principales",
      "Evaluar el aprendizaje de los estudiantes y darles retroalimentación",
      "Crear un ambiente de aula motivador y de apoyo",
      "Comunicarse con las familias sobre el progreso de los estudiantes"
    ],
    "workActivities": [
      "Enseñar — Instruir a los estudiantes en lectura, matemáticas, ciencias y estudios sociales",
      "Guiar — Acompañar a los estudiantes en su crecimiento personal y académico",
      "Organizar — Planear el plan de estudios y manejar las actividades del aula"
    ]
  },
  "s8": {
    "title": "Cuidador de Niños",
    "description": "Atiende a los niños en escuelas, empresas u hogares, brindándoles cuidado y supervisión.",
    "tasks": [
      "Supervisar y vigilar a los niños durante las actividades",
      "Planear y dirigir juegos educativos y de creatividad",
      "Preparar comidas y meriendas para los niños",
      "Comunicarse con las familias sobre las actividades y el comportamiento del día"
    ],
    "workActivities": [
      "Ayudar a Otros — Cuidar a los niños y apoyar su desarrollo",
      "Organizar — Planear horarios diarios y actividades acordes a la edad",
      "Comunicar — Informar a las familias y colaborar con tus compañeros de trabajo"
    ]
  },
  "s9": {
    "title": "Terapeuta Ocupacional",
    "description": "Ayuda a los pacientes a desarrollar, recuperar y mejorar las habilidades que necesitan para la vida diaria y el trabajo.",
    "tasks": [
      "Evaluar las habilidades del paciente para la vida diaria y el trabajo",
      "Diseñar actividades de tratamiento personalizadas",
      "Recomendar equipos de apoyo y adaptaciones",
      "Registrar el progreso del paciente hacia las metas de la terapia"
    ],
    "workActivities": [
      "Ayudar a Otros — Apoyar a los pacientes a recuperar su independencia en las tareas diarias",
      "Tomar Decisiones — Elegir las terapias que mejor se adapten a cada paciente",
      "Pensar de Forma Creativa — Diseñar soluciones adaptadas a los retos funcionales"
    ]
  },
  "s10": {
    "title": "Líder Religioso",
    "description": "Dirige servicios religiosos, brinda orientación espiritual y apoya a los miembros de la comunidad en momentos de necesidad.",
    "tasks": [
      "Dirigir servicios religiosos, ceremonias y rituales",
      "Brindar consejería y orientación espiritual",
      "Visitar a miembros de la comunidad enfermos, en duelo o que no pueden salir de casa",
      "Organizar programas de servicio y apoyo a la comunidad"
    ],
    "workActivities": [
      "Ayudar a Otros — Ofrecer apoyo emocional y espiritual",
      "Comunicar — Dar sermones y aconsejar a las personas",
      "Organizar — Planear los servicios religiosos y los programas comunitarios"
    ]
  },
  "e1": {
    "title": "Ejecutivo/a de Empresa",
    "description": "Planifica, dirige y coordina las operaciones de empresas u organizaciones al más alto nivel.",
    "tasks": [
      "Definir las metas y la dirección estratégica de la organización",
      "Supervisar presupuestos, operaciones y el desempeño del personal",
      "Negociar contratos y acuerdos comerciales",
      "Representar a la organización ante las partes interesadas y el público"
    ],
    "workActivities": [
      "Tomar Decisiones — Definir la estrategia y dirigir las prioridades de la organización",
      "Guiar a Otros — Liderar equipos y dirigir al personal de alto nivel",
      "Comunicar — Hacer presentaciones ante juntas directivas, inversionistas y el público"
    ]
  },
  "e2": {
    "title": "Gerente de Ventas",
    "description": "Dirige equipos de ventas y desarrolla estrategias para alcanzar las metas de ventas de la organización.",
    "tasks": [
      "Definir metas de ventas y desarrollar planes de ventas",
      "Capacitar y motivar a los integrantes del equipo de ventas",
      "Analizar datos de ventas y tendencias del mercado",
      "Crear y mantener relaciones clave con los clientes"
    ],
    "workActivities": [
      "Guiar a Otros — Orientar y dirigir a los representantes de ventas",
      "Analizar Datos — Revisar métricas de ventas para mejorar el desempeño",
      "Comunicar — Negociar acuerdos y hacer presentaciones a los clientes"
    ]
  },
  "e3": {
    "title": "Abogado/a",
    "description": "Asesora y representa a clientes en asuntos legales, redacta documentos y defiende casos en los tribunales.",
    "tasks": [
      "Investigar temas legales e interpretar leyes y normativas",
      "Representar a los clientes en procesos judiciales",
      "Redactar contratos, testamentos y otros documentos legales",
      "Asesorar a los clientes sobre sus derechos y obligaciones legales"
    ],
    "workActivities": [
      "Procesar Información — Investigar jurisprudencia y precedentes legales",
      "Comunicar — Defender casos y negociar acuerdos",
      "Tomar Decisiones — Asesorar a los clientes sobre la estrategia legal"
    ]
  },
  "e4": {
    "title": "Emprendedor/a",
    "description": "Crea y dirige negocios, identifica oportunidades de mercado y gestiona todos los aspectos de un emprendimiento.",
    "tasks": [
      "Desarrollar planes de negocio y conseguir financiamiento",
      "Identificar oportunidades de mercado y necesidades de los clientes",
      "Gestionar las operaciones diarias, el personal y las finanzas",
      "Promocionar productos y servicios para hacer crecer el negocio"
    ],
    "workActivities": [
      "Pensar de Forma Creativa — Innovar en productos, servicios y modelos de negocio",
      "Tomar Decisiones — Evaluar riesgos y asignar recursos",
      "Comunicar — Presentar el proyecto a inversionistas y crear relaciones con los clientes"
    ]
  },
  "e5": {
    "title": "Asesor/a Financiero/a",
    "description": "Asesora a los clientes sobre planes financieros, inversiones, seguros y otras decisiones de dinero.",
    "tasks": [
      "Evaluar las metas financieras y la tolerancia al riesgo del cliente",
      "Recomendar estrategias y productos de inversión",
      "Dar seguimiento a las carteras de los clientes y a las condiciones del mercado",
      "Preparar planes financieros e informes"
    ],
    "workActivities": [
      "Analizar Datos — Evaluar los mercados financieros y las opciones de inversión",
      "Comunicar — Explicar conceptos financieros complejos a los clientes",
      "Tomar Decisiones — Recomendar estrategias según las metas del cliente"
    ]
  },
  "e6": {
    "title": "Especialista en Relaciones Públicas",
    "description": "Crea y mantiene una imagen pública favorable para organizaciones o personas reconocidas.",
    "tasks": [
      "Redactar comunicados de prensa y preparar kits para los medios",
      "Coordinar apariciones públicas y eventos",
      "Monitorear la opinión pública y la cobertura de los medios",
      "Desarrollar estrategias de comunicación para clientes u organizaciones"
    ],
    "workActivities": [
      "Comunicar — Crear mensajes y gestionar las relaciones con los medios",
      "Pensar de Forma Creativa — Desarrollar campañas para moldear la percepción pública",
      "Organizar — Planificar eventos y coordinar la difusión en los medios"
    ]
  },
  "e7": {
    "title": "Vendedor/a de Autos",
    "description": "Vende autos nuevos o usados y ayuda a los clientes a encontrar el vehículo que se ajuste a sus necesidades y presupuesto.",
    "tasks": [
      "Recibir a los clientes y evaluar sus necesidades de vehículo",
      "Mostrar las características del vehículo y organizar pruebas de manejo",
      "Negociar precios y opciones de financiamiento",
      "Completar los trámites de venta y los procedimientos de entrega"
    ],
    "workActivities": [
      "Comunicar — Persuadir a los clientes y explicar las características del vehículo",
      "Tomar Decisiones — Encontrar el vehículo ideal para cada cliente",
      "Procesar Información — Gestionar el financiamiento y la documentación de la venta"
    ]
  },
  "e8": {
    "title": "Conferencista Motivacional",
    "description": "Da discursos y presentaciones para inspirar y motivar al público hacia el crecimiento personal o profesional.",
    "tasks": [
      "Investigar y desarrollar los temas y el contenido de las presentaciones",
      "Dar discursos atractivos para públicos diversos",
      "Promocionar sus servicios de conferencista y agendar presentaciones",
      "Adaptar los mensajes a grupos y eventos específicos"
    ],
    "workActivities": [
      "Comunicar — Dar presentaciones impactantes ante grandes públicos",
      "Pensar de Forma Creativa — Crear historias cautivadoras y contenido motivacional",
      "Organizar — Gestionar las presentaciones, los viajes y la promoción"
    ]
  },
  "e9": {
    "title": "Político/a",
    "description": "Representa a la ciudadanía en el gobierno, desarrolla leyes y atiende los problemas de la comunidad.",
    "tasks": [
      "Reunirse con la ciudadanía para entender las necesidades de la comunidad",
      "Redactar y votar leyes y propuestas de políticas públicas",
      "Hacer campaña para un cargo público y conseguir apoyo de la gente",
      "Colaborar con otras autoridades en temas de gobierno"
    ],
    "workActivities": [
      "Comunicar — Hablar en público y debatir temas de políticas públicas",
      "Tomar Decisiones — Votar leyes y definir las prioridades de las políticas públicas",
      "Resolver Conflictos — Negociar acuerdos entre intereses opuestos"
    ]
  },
  "e10": {
    "title": "Administrador/a de Propiedades",
    "description": "Administra propiedades inmobiliarias en nombre de los dueños, encargándose de las operaciones, los inquilinos y el mantenimiento.",
    "tasks": [
      "Evaluar a los inquilinos y gestionar los contratos de arrendamiento",
      "Coordinar el mantenimiento y las reparaciones de las propiedades",
      "Cobrar la renta y administrar los presupuestos de las propiedades",
      "Asegurar que las propiedades cumplan con las normas de vivienda"
    ],
    "workActivities": [
      "Organizar — Supervisar las operaciones y los calendarios de mantenimiento de las propiedades",
      "Comunicar — Interactuar con inquilinos, dueños y contratistas",
      "Tomar Decisiones — Resolver los problemas de los inquilinos y gestionar las finanzas"
    ]
  },
  "c1": {
    "title": "Contador/a",
    "description": "Prepara y revisa registros financieros, verifica que sean exactos y que los impuestos se paguen correctamente.",
    "tasks": [
      "Preparar y revisar estados financieros",
      "Asegurar el cumplimiento de las normas tributarias",
      "Auditar registros financieros para verificar su exactitud",
      "Asesorar a los clientes sobre planificación financiera y presupuestos"
    ],
    "workActivities": [
      "Analizar datos — Revisar registros financieros e identificar diferencias",
      "Procesar información — Preparar declaraciones de impuestos e informes financieros",
      "Documentar información — Mantener registros contables exactos"
    ]
  },
  "c2": {
    "title": "Analista Financiero/a",
    "description": "Analiza datos y tendencias financieras para guiar las decisiones de inversión de las empresas.",
    "tasks": [
      "Analizar estados financieros y tendencias del mercado",
      "Preparar informes con recomendaciones de inversión",
      "Crear modelos financieros para proyectar el rendimiento",
      "Monitorear las condiciones económicas que afectan las inversiones"
    ],
    "workActivities": [
      "Analizar datos — Evaluar datos financieros y condiciones del mercado",
      "Procesar información — Crear hojas de cálculo y modelos financieros",
      "Comunicar — Presentar análisis y recomendaciones a las partes interesadas"
    ]
  },
  "c3": {
    "title": "Asistente Legal",
    "description": "Apoya a los abogados investigando precedentes legales, organizando expedientes y redactando documentos.",
    "tasks": [
      "Investigar precedentes legales y reunir materiales de los casos",
      "Redactar documentos legales y correspondencia",
      "Organizar y mantener expedientes y bases de datos",
      "Ayudar a los abogados a prepararse para juicios y audiencias"
    ],
    "workActivities": [
      "Procesar información — Investigar leyes y organizar materiales legales",
      "Documentar información — Redactar documentos y mantener los expedientes",
      "Trabajar con computadoras — Usar bases de datos legales y software de gestión de casos"
    ]
  },
  "c4": {
    "title": "Técnico/a en Registros Médicos",
    "description": "Organiza, gestiona y codifica la información de salud de los pacientes en sistemas electrónicos.",
    "tasks": [
      "Revisar y codificar los registros de salud de los pacientes",
      "Asegurar la exactitud e integridad de los datos médicos",
      "Mantener los sistemas de registros médicos electrónicos",
      "Procesar reclamos de seguros y verificar la documentación"
    ],
    "workActivities": [
      "Procesar información — Codificar diagnósticos y procedimientos con exactitud",
      "Trabajar con computadoras — Gestionar los sistemas de registros médicos electrónicos",
      "Documentar información — Asegurar que los registros médicos cumplan con las normas"
    ]
  },
  "c5": {
    "title": "Secretario/a Judicial",
    "description": "Realiza tareas administrativas en los tribunales, gestiona registros y apoya a los jueces.",
    "tasks": [
      "Preparar las agendas y los calendarios de los casos del tribunal",
      "Registrar los procesos judiciales y mantener los registros oficiales",
      "Tramitar documentos legales como mociones y resoluciones",
      "Apoyar a los jueces con tareas administrativas durante los juicios"
    ],
    "workActivities": [
      "Documentar información — Registrar los procesos y mantener los registros legales",
      "Procesar información — Gestionar los calendarios del tribunal y los expedientes",
      "Comunicar — Coordinar con jueces, abogados y el público"
    ]
  },
  "c6": {
    "title": "Oficial de Préstamos",
    "description": "Evalúa, autoriza o recomienda la aprobación de solicitudes de préstamo para personas y empresas.",
    "tasks": [
      "Revisar las solicitudes de préstamo y los documentos financieros",
      "Evaluar la capacidad de pago y el riesgo del solicitante",
      "Explicar los términos y condiciones del préstamo a los solicitantes",
      "Tramitar y aprobar o rechazar las solicitudes de préstamo"
    ],
    "workActivities": [
      "Analizar datos — Evaluar documentos financieros e historiales crediticios",
      "Tomar decisiones — Aprobar o rechazar las solicitudes de préstamo",
      "Comunicar — Explicar los productos y términos de los préstamos a los clientes"
    ]
  },
  "c7": {
    "title": "Administrador/a de Oficina",
    "description": "Coordina las actividades y operaciones de la oficina para asegurar su eficiencia y el cumplimiento de las políticas.",
    "tasks": [
      "Gestionar los suministros, los horarios y la correspondencia de la oficina",
      "Coordinar reuniones, viajes y eventos",
      "Mantener los sistemas de archivo y los registros de la organización",
      "Supervisar al personal de apoyo administrativo"
    ],
    "workActivities": [
      "Organizar — Gestionar las operaciones de la oficina y mantener los sistemas",
      "Comunicar — Coordinar con el personal, los clientes y los proveedores",
      "Trabajar con computadoras — Usar software de oficina y bases de datos"
    ]
  },
  "c8": {
    "title": "Preparador/a de Impuestos",
    "description": "Prepara declaraciones de impuestos para personas o empresas y asegura el cumplimiento de las normas tributarias.",
    "tasks": [
      "Entrevistar a los clientes para reunir información financiera",
      "Preparar declaraciones de impuestos federales, estatales y locales",
      "Calcular las obligaciones tributarias e identificar las deducciones",
      "Revisar las declaraciones para verificar su exactitud antes de presentarlas"
    ],
    "workActivities": [
      "Procesar información — Calcular impuestos y preparar declaraciones exactas",
      "Obtener información — Entrevistar a los clientes sobre sus ingresos y gastos",
      "Actualizar conocimientos — Mantenerte al día con los cambios en las leyes tributarias"
    ]
  },
  "c9": {
    "title": "Auxiliar de Nómina",
    "description": "Reúne y registra el tiempo de los empleados y los datos de nómina, y procesa los pagos de sueldos.",
    "tasks": [
      "Procesar las hojas de horas de los empleados y calcular los sueldos",
      "Calcular las deducciones por impuestos, beneficios y embargos",
      "Emitir los cheques de pago y gestionar los depósitos directos",
      "Mantener los registros de nómina y responder las consultas de los empleados"
    ],
    "workActivities": [
      "Procesar información — Calcular sueldos, deducciones y pago neto",
      "Trabajar con computadoras — Usar software de nómina y bases de datos",
      "Documentar información — Mantener registros de nómina exactos"
    ]
  },
  "c10": {
    "title": "Bibliotecario/a",
    "description": "Organiza las colecciones de la biblioteca, ayuda a las personas a encontrar información y dirige programas comunitarios.",
    "tasks": [
      "Catalogar y clasificar los materiales de la biblioteca",
      "Ayudar a los usuarios a encontrar información y recursos",
      "Planificar y dirigir programas de lectura comunitarios",
      "Gestionar las bases de datos y las colecciones digitales de la biblioteca"
    ],
    "workActivities": [
      "Organizar — Catalogar y mantener las colecciones de la biblioteca",
      "Ayudar a los demás — Ayudar a los usuarios a encontrar información y recursos",
      "Trabajar con computadoras — Gestionar catálogos digitales y bases de datos en línea"
    ]
  }
};

// Return a copy of the occupation with Spanish text when lang === 'es' and a translation exists.
export function localizeOccupation(occ: Occupation, lang: Lang): Occupation {
  if (lang !== 'es') return occ;
  const es = OCCUPATIONS_ES[occ.id];
  if (!es) return occ;
  return { ...occ, title: es.title, description: es.description, tasks: es.tasks, workActivities: es.workActivities };
}
