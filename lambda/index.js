const Alexa = require('ask-sdk-core');
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');
const DOCUMENT_ID = ["Bienvenida","ayuda","blog","adios","pedirfolio","muestracita","mensajesVariados"];
const SN = ["mostrarNuevamente"]
const axios = require('axios');

//datos del usuario atravez del token
var permisos,userId, userNombre, userCorreo = null;
var folioR;
var persistenceAdapter = getPersistenceAdapter();
function getPersistenceAdapter() {
    // This function is an indirect way to detect if this is part of an Alexa-Hosted skill
    function isAlexaHosted() {
        return process.env.S3_PERSISTENCE_BUCKET ? true : false;
    }
    const tableName = 'user_table';
    if(isAlexaHosted()) {
        const {S3PersistenceAdapter} = require('ask-sdk-s3-persistence-adapter');
        return new S3PersistenceAdapter({ 
            bucketName: process.env.S3_PERSISTENCE_BUCKET
        });
    } else {
        // IMPORTANT: don't forget to give DynamoDB access to the role you're to run this lambda (IAM)
        const {DynamoDbPersistenceAdapter} = require('ask-sdk-dynamodb-persistence-adapter');
        return new DynamoDbPersistenceAdapter({ 
            tableName: tableName,
            createTable: true
        });
    }
}
/*CORRESPONDIENTE A LAS CITAS*/
var datasource = {
    "helloWorldDataSource": {
        "primaryText": "Hola mundooooooo!",
        "secondaryText": "Welcome to alexa presentation",
        "color": "@colorRed800"
    },
    "blogDataSource": {
        "titulo": "LA BURSITIS",
        "contenido": "Sabias que…!! La bursitis es la inflamación de las almohadillas llenas de líquido (bolsas sinoviales) que funcionan como amortiguadores en las articulaciones, suele ocurrir en las articulaciones que hacen movimientos frecuentes y repetitivos.",
        "imagenSource": "https://prophysio.tagme.uno/public/blog_images/bursitis.PNG"
    },
    "citaDataSource": {
        "nombre":"Yahir",
        "dia": "Dia: 2023-06-15",
        "hora":"Hora: 15:00",
        "tipo":"Tipo de terapia: Pulmonar",
        "terapeuta":"Terapeuta: Lizbeth Mendoza Redondo",
        "recomendacion":"Te recomendamos Llevar ropa cómoda"
    },
    "mensajesComplementarios":{
        "texto":"Parece que ocurrió un error, verifica que el folio sea el correcto y vuelve a intentar."
    },
    "bienvenidaDatasource": {
        "texto":"Bienvenido, puedes pedir que te muestre el blog, también puedes consultar una cita, registrar una cita, cancelar una cita o reagendar una cita."
        
    },
    "pedirFolioData":{
        "texto":"Menciona los dígitos del folio de tu cita",
        "textoRound":"Dame el folio"
    },
    
    "ayudaData":{
        "texto":"Si necesitas ayuda ingresa a nuestro siito"
    },
    "adiosData": {
        "texto": "Si necesitas ayuda ingresa al sitio"
    }
    
};
var dataBasic={
    "bienvenidaDatasource": {
        "texto":"Bienvenido, puedes pedir que te muestre el blog, también puedes consultar una cita, registrar una cita, cancelar una cita o reagendar una cita."
        
    },
    "pedirFolioData":{
        "texto":"Menciona los dígitos del folio de tu cita",
        "textoRound":"Dame el folio"
    }
}
/*INSTRUCCIONES BASICAS*/
const languageStrings = {
    es : {
        translation : {
            BIENVENIDA: "Bienvenido %s, puedes pedir que te muestre el blog, también puedes consultar una cita, registrar una cita, cancelar una cita o reagendar una cita.",
            PEDIRTOKEN:"Hola,antes de comenzar dame el token para poder iniciar sesión, si aun no tienes un token visita nuestra pagina y accece a tu cuenta para generarlo",
            BIENVENIDAT:"Bienvenido terapeuta %s, puede consultar sus citas",
            PEDIRFOLIOCONSULTA:"Menciona los dígitos del folio de tu cita",
            PEDIRFOLIOREAGENDAR:"Menciona el folio de la cita que deseas reagendar, hazlo de la siguiente manera y mencionas el folio. Mi folio para reagendar es",
            PEDIRFOLIOCANCELAR:"Menciona el folio de la cita que deseas cancelar, hazlo de la siguiente manera y mencionas el folio. Mi folio para cancelar es",
            PEDIRFOLIOCONSULTAR:"Dame el folio",
            NOMBRE:'Nombre: ',
            DIA:"Dia: ",
            HORA:"Hora: ",
            TIPO:"Tipo de terapia: ",
            TERA:"Terapeuta: ",
            RECOM:"Te recomendamos ",
            FOLIONULL:"no se encontró ninguna cita con ese folio",
            ERRORFOLIO:"Parece que ocurrió un error, verifica que el folio sea el correcto y vuelve a intentar. Tipo de error: ",
            CITAATENDIDA: "La cita ya fue atendida",
            CITACANCELADA: "La cita fue cancelada",
            PEDIRDATOSAGENDAR:"Indica para cuando es tu cita, comenzando con la fecha, posteriormente la hora, el tipo de terapia que puede ser deportiva, geriátrica, pulmonar o pediátrica",
            MSGREGISTROCITA:"Tu cita es el %s, a las %s, el tipo de terapia es %s, y el terapeuta es %s. Tu folio es %s",
            FOLIOREAGENDARENCONTRADO:"Indica para cuando se reagenda tu cita, comenzando con la nueva fecha, posteriormente la hora",
            FOLIOCANCELADOCONEXITO:"La cita se canceló exitosamente",
            CANCELADAOATENDIDA:"La cita ya fue cancelada o ya fue atendida",
            MSGTERAPEUTA:"Esta acción unicamente esta disponible para los pacientes",
            MSGPACIENTE:"Esta acción unicamente esta disponible, para el o la terapeuta",
            REAGENDARFECHAOCUPADA:"no está disponible la nueva fecha con el terapeuta",
            MSGREAGENDACITA:"La cita fue reagendada exitosamente, la nueva fecha es %s a las %s",
            MSGCONSULTACITAS:"De que fecha quieres realizar la consulta?",
            NINGUNA_CITA: 'El dia {{fecha}} no tienes ninguna cita programada',
            CITAS: 'El dia {{fecha}} tienes {{cant}} citas. A las: ',
            TOKENINVALIDO:"El token no es valido",
            EXTRA:"¿Deseas algo más?, puedes pedir que te muestre el blog, también puedes consultar una cita, registrar una cita, cancelar una cita o reagendar una cita.",
            MSGFIN:"Entiendo, puedes volver a consultar cuando gustes",
            MSGNUEVAMENTE:"Puedes pedir que te muestre el blog, también puedes consultar una cita, registrar una cita, cancelar una cita o reagendar una cita",
            MSGALGOMAS:"Desea hacer algo más?",
            ERRORARTICULOS:"Error al obtener los articulos",
            FECHAHORA:"Fecha u hora ocupados",
            AYUDA:"Si necesitas ayuda ingresa a nuestro sitio",
            ADIOS:"Hasta luego",
            NOENTENDER:"Disculpa, no entiendo lo que tratas de decirme. Inetnta de nuevo",
            MSGFC:"El folio para consultar?",
            MSGFR:"El folio para reagendar es?",
            MSGFCA:"El folio para cancelar es?",
            MSGA:"Dame el día, hora y el tipo de terapia",
            MSGINI:"Deseas realiza algo?",
            MSGPEDIR:"Para consultar las citas tienes que proporcionarme una fecha",
            CONTINUAROCERRAR:"Desea realizar algo más?, o puede finalizar diciendo adios"
            
            
            
        }
    },
    en : {
        translation : {
            BIENVENIDO: "Bienvenido, puedes pedir que te muestre el blog, también puedes consultar una cita, registrar una cita, cancelar una cita o reagendar una cita.",
            BIENVENIDA: "Welcome %s , you can ask me to show you the blog, you can also check an appointment, register an appointment, cancel an appointment or reschedule an appointment.",
            PEDIRTOKEN:"Hello, before starting, give me the token to be able to log in, if you still do not have a token, visit our page and access your account to generate it",
            BIENVENIDAT:"Welcome therapist %s , you can check your appointments",
            PEDIRFOLIOCONSULTA:"Mention the digits of the folio of your appointment",
            PEDIRFOLIOREAGENDAR:"Mention the folio of the appointment you want to reschedule, do it in the following way and mention the folio. My folio to reschedule is",
            PEDIRFOLIOCANCELAR:"Mention the folio of the appointment you want to cancel, do it in the following way and mention the folio. My folio to cancel is",
            PEDIRFOLIOCONSULTAR:"Give me the folio",
            NOMBRE:'Name: ',
            DIA: "Day: ",
            HORA:"Time: ",
            TIPO:"Type of therapy: ",
            TERA: "Therapist: ",
            RECOM: "We recommend ",
            FOLIONULL:"no citation was found with that folio",
            ERRORFOLIO:"It seems that an error occurred, verify that the folio is correct and try again. Bug type: ",
            CITAATENDIDA: "The appointment has already been attended",
            CITACANCELADA: "The appointment was canceled",
            PEDIRDATOSAGENDAR: "Indicate when is your appointment, starting with the date, then the time, the type of therapy that can be sports, geriatric, pulmonary",
            MSGREGISTROCITA:"Your appointment is on %s, at %s, the type of therapy is %s, and the therapist is %s. Your folio is %s",
            FOLIOREAGENDARENCONTRADO:"Indicate when your appointment is rescheduled, starting with the new date, then the time",
            FOLIOCANCELADOCONEXITO:"The appointment was successfully canceled",
            CANCELADAOATENDIDA:"The appointment has already been canceled or has already been attended",
            MSGTERAPEUTA:"This action is only available for patients",
            MSGPACIENTE:"This action is only available for the therapist",
            REAGENDARFECHAOCUPADA:"the new date is not available with that therapist",
            MSGREAGENDACITA:"The appointment was successfully rescheduled, the new date is %s at %s",
            MSGCONSULTACITAS:"From what date do you want to make the consultations?",
            NINGUNA_CITA: 'On {{fecha}} you have no appointment scheduled',
            CITAS: 'On {{fecha}} you have {{cant}} appointments. At: ',
            TOKENINVALIDO:"the token is not valid",
            EXTRA:"Do you want something else? You can ask to be shown the blog, you can also check an appointment, register an appointment, cancel an appointment or reschedule an appointment.",
            MSGFIN: "I understand, you can check again whenever you like",
            MSGNUEVAMENTE:"Puedes pedir que te muestre el blog, también puedes consultar una cita, registrar una cita, cancelar una cita o reagendar una cita",
            MSGALGOMAS:"Do you want to do something else?",
            ERRORARTICULOS:"Error getting items",
            FECHAHORA:"Busy date or time",
            AYUDA:"If you need help, visit our site",
            ADIOS:"See you later",
            NOENTENDER:"Sorry, I don't know about that. Please try again.",
            MSGFC: "The folio to consult?",
            MSGFR: "The folio to reschedule is?",
            MSGFCA: "The folio to cancel is?",
            MSGA: "Give me the day, time and type of therapy",
            MSGINI:"Do you want to do something?",
            MSGPEDIR:"To consult the appointments you have to provide a date",
            CONTINUAROCERRAR:"Do you want to do something else?, or you can end by saying goodbye"
        }
    }
}

const createDirectivePayload = (aplDocumentId, dataSources = {}, tokenId = "documentToken") => {
    return {
        type: "Alexa.Presentation.APL.RenderDocument",
        token: tokenId,
        document: {
            type: "Link",
            src: "doc://alexa/apl/documents/" + aplDocumentId
        },
        datasources: dataSources
    }
};

/******************************************************+LAUNCH*************************************************************************/
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const requestAttributes=handlerInput.attributesManager.getRequestAttributes();
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        
        let speakOutput;
        
        let permisos = sessionAttributes['permisos'];
        let correo = sessionAttributes['correo'];
        let id = sessionAttributes['id'];
        let nombre = sessionAttributes['nombre'];
        
        speakOutput = requestAttributes.t('PEDIRTOKEN');
        
        datasource['mensajesComplementarios']['texto']=speakOutput;
        
        
        if(permisos && correo && id && nombre){
            if(permisos==="1"){
                speakOutput=requestAttributes.t('BIENVENIDA',nombre)
            datasource['bienvenidaDatasource']['texto'] = speakOutput;
                
            }else if(permisos==="2"){
            speakOutput=requestAttributes.t('BIENVENIDAT',nombre)
            datasource['bienvenidaDatasource']['texto'] = speakOutput;
            }
        }
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // generate the APL RenderDocument directive that will be returned from your skill
            const aplDirective = createDirectivePayload(DOCUMENT_ID[0], datasource);
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};


/*Aqui esta la funcion que dice el contenido del blog al usuario*/
const blogHandler = {
    async canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'entrarBlog';
    },
    async handle(handlerInput) {
        const requestAttributes=handlerInput.attributesManager.getRequestAttributes();
        const url = 'http://127.0.0.1:8000/api/articulos';
        let speechOutput;
        try {
              const response = await axios.get('https://prophysio.tagme.uno/public/api/articulos');
              const datos = response.data;
        
              if (datos.length > 0) {
                  
                const articulo = datos[Math.floor(Math.random() * datos.length)];
        
                datasource['blogDataSource']['titulo'] = articulo['nombre'];
                datasource['blogDataSource']['contenido'] = articulo['contenido'];
                datasource['blogDataSource']['imagenSource'] = articulo['imagen'];
                
                speechOutput =  articulo['nombre'] + '. ' + articulo['contenido'] +'. '+requestAttributes.t('MSGALGOMAS');
        
                if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
                    // generate the APL RenderDocument directive that will be returned from your skill
                    const aplDirective = createDirectivePayload(DOCUMENT_ID[2], datasource);
                    // add the RenderDocument directive to the responseBuilder
                    handlerInput.responseBuilder.addDirective(aplDirective);
                }
                
              } 
              else   {
                  speechOutput = requestAttributes.t('ERRORARTICULOS');
                  if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
                    // generate the APL RenderDocument directive that will be returned from your skill
                    const aplDirective = createDirectivePayload(DOCUMENT_ID[2], datasource);
                    // add the RenderDocument directive to the responseBuilder
                    handlerInput.responseBuilder.addDirective(aplDirective);
                }
              }
        } 
        catch (error) {
            console.error('Error al obtener los articulos:', error);
            speechOutput = `Ocurrió un error al obtener los artículos. Tipo de error: ${error.message}`;

        }
        
        return handlerInput.responseBuilder.
        speak(speechOutput)
        .reprompt(requestAttributes.t('CONTINUAROCERRAR'))
        .getResponse();
        
    
    }
}
const mostrarNuevamenteHandler ={
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'mostrarDenuevo';
    },
    handle(handlerInput) {
        const respuesta = handlerInput.requestEnvelope.request.intent.slots.resp.value;
        const requestAttributes=handlerInput.attributesManager.getRequestAttributes();
        var type=0;
        let speakOutput;
        if(respuesta==="si" || respuesta==="yes"){
            speakOutput = requestAttributes.t('MSGNUEVAMENTE');
            if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // generate the APL RenderDocument directive that will be returned from your skill
            const aplDirective = createDirectivePayload(SN[type], datasource);
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }
        }else if(respuesta==="no"){
            speakOutput = requestAttributes.t('MSGFIN');
        }
        

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
}


/*Aqui unicamente se muestra el apl pediendo el folio*/
const folioHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'realizaConsulta';
    },
    handle(handlerInput) {
        const requestAttributes=handlerInput.attributesManager.getRequestAttributes();
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        let permisos = sessionAttributes['permisos'];
        let speakOutput;
        let type;
        if(permisos!=="1"){
            speakOutput=requestAttributes.t('MSGTERAPEUTA')
            datasource['mensajesComplementarios']['texto']=speakOutput;
            type=6
        }else{
            const textoRound=requestAttributes.t('PEDIRFOLIOCONSULTAR');
            speakOutput=requestAttributes.t('PEDIRFOLIOCONSULTA');
            datasource["pedirFolioData"]["texto"]=speakOutput;
            datasource["pedirFolioData"]["textoRound"]=textoRound;
            type=4
        }
        
         if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // generate the APL RenderDocument directive that will be returned from your skill
            const aplDirective = createDirectivePayload(DOCUMENT_ID[type], datasource);
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(requestAttributes.t('MSGFCA'))
            .getResponse();
    }
} 

/*Aqui unicamente pide los datos de la cita*/
const datosCitaHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'agendaCita';
    },
    handle(handlerInput) {
        const requestAttributes=handlerInput.attributesManager.getRequestAttributes();
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        let speakOutput;
        let permisos = sessionAttributes['permisos'];
        let type;
        if(permisos!=='1'){
            speakOutput=requestAttributes.t('MSGTERAPEUTA')
            datasource['mensajesComplementarios']['texto']=speakOutput;
            type=6;
        }else{
            speakOutput=requestAttributes.t('PEDIRDATOSAGENDAR');
            datasource["mensajesComplementarios"]["texto"]=speakOutput;
            type=4
        }
        
         if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // generate the APL RenderDocument directive that will be returned from your skill
            const aplDirective = createDirectivePayload(DOCUMENT_ID[type], datasource);
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(requestAttributes.t('MSGA'))
            .getResponse();
    }
}

/*Aqui unicamente pide y muestra el apl de pedir el folio para reagendar*/
const datosReagendarCitaHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'reagendaCita';
    },
    handle(handlerInput) {
        const requestAttributes=handlerInput.attributesManager.getRequestAttributes();
        let speakOutput=requestAttributes.t('PEDIRFOLIOREAGENDAR');
        const textoRound=requestAttributes.t('PEDIRFOLIOCONSULTAR');
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        let permisos = sessionAttributes['permisos'];
        let type;
        if(permisos!=="1"){
            speakOutput=requestAttributes.t('MSGTERAPEUTA')
            datasource['mensajesComplementarios']['texto']=speakOutput;
            type=6;
        }else{
        datasource["pedirFolioData"]["texto"]=speakOutput;
        datasource["pedirFolioData"]["textoRound"]=textoRound;
        type=4;
            
        }
         if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // generate the APL RenderDocument directive that will be returned from your skill
            const aplDirective = createDirectivePayload(DOCUMENT_ID[type], dataBasic);
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(requestAttributes.t('MSGFR'))
            .getResponse();
    }
}

/*Aqui unicamente pide y muestra el apl de pedir el folio para cancelar*/
const datosCancelarCitaHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'cancelaCita';
    },
    handle(handlerInput) {
        const requestAttributes=handlerInput.attributesManager.getRequestAttributes();
        let speakOutput;
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        let permisos = sessionAttributes['permisos'];
        let type;
        if(permisos!=="1"){
            speakOutput=requestAttributes.t('MSGTERAPEUTA')
            datasource['mensajesComplementarios']['texto']=speakOutput;
            type=6;
        }else{
            speakOutput=requestAttributes.t('PEDIRFOLIOCANCELAR');
            const textoRound=requestAttributes.t('PEDIRFOLIOCANCELAR');
            datasource["pedirFolioData"]["texto"]=speakOutput;
            datasource["pedirFolioData"]["textoRound"]=textoRound;
            type=6
        }
        
         if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // generate the APL RenderDocument directive that will be returned from your skill
            const aplDirective = createDirectivePayload(DOCUMENT_ID[type], datasource);
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(requestAttributes.t('MSGFCA'))
            .getResponse();
    }
} 


/*Aqui haces la funcion para mostrar la fecha de la cita, ya esta el apl***************************Consultar*/
const mostrarcitaHandler ={
    async canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'darFolioIntent';
    },
    async handle(handlerInput) {
        const requestAttributes=handlerInput.attributesManager.getRequestAttributes();
        const nombre=requestAttributes.t('NOMBRE')
        const dia=requestAttributes.t('DIA')
        const hora=requestAttributes.t('HORA')
        const tipo=requestAttributes.t('TIPO')
        const terapeuta=requestAttributes.t('TERA')
        const recomendacion=requestAttributes.t('RECOM')
        const noEncontrado=requestAttributes.t('FOLIONULL')
        const errorFolio=requestAttributes.t('ERRORFOLIO')
        const cancelada=requestAttributes.t('CITACANCELADA')
        const atentida=requestAttributes.t('CITAATENDIDA')
        var Apl;
        const msgextra=requestAttributes.t('EXTRA')
        const folio = handlerInput.requestEnvelope.request.intent.slots.folio.value;
        const folio2 = folio.toString(); //'20230809190000718';
        const url = 'https://prophysio.tagme.uno/public/api/consultaCita?folio='+folio2;
        let speechOutput;
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        let permisos = sessionAttributes['permisos'];
        
        try {
            if(permisos!=="1"){
                speechOutput=requestAttributes.t('MSGTERAPEUTA')
                datasource['mensajesComplementarios']['texto']=speechOutput;
                Apl=6;
            }else{
              const response = await axios.get(url);
              const cita = response.data;
              if(!cita){
                 datasource['mensajesComplementarios']['texto']=noEncontrado;
                Apl=6;
                  speechOutput = noEncontrado;
              }else{
                if(cita['estado']==='2'){
                    datasource['mensajesComplementarios']['texto']=cancelada;
                    Apl=6;
                    speechOutput = cancelada;
                } 
                else if(cita['estado']==='3'){
                    datasource['mensajesComplementarios']['texto']=atentida;
                    Apl=6;
                    speechOutput = atentida;
                }
                else if(cita['estado']==='1'){
                    const date = cita;
                    const dataArr=date['fecha'].split(' ');
                    var day=dataArr[0];
                    var hours=dataArr[1];
                    datasource['citaDataSource']['nombre'] =nombre+ date['nombre'];
                    datasource['citaDataSource']['dia'] = dia+ day;
                    datasource['citaDataSource']['hora']=hora+ hours;
                    datasource['citaDataSource']['tipo']=tipo+date['tipoTerapia'];
                    datasource['citaDataSource']['terapeuta']=terapeuta+date['terapeuta'];
                    datasource['citaDataSource']['recomendacion']=recomendacion+date['recomendaciones'];
                    speechOutput = nombre+date['nombre']+'. '+dia+ day+'. '+hora+hours+'. '+tipo+date['tipoTerapia']+'. '+terapeuta+date['terapeuta']+'. '+recomendacion+date['recomendaciones']+'. '+msgextra;
                    Apl=5;
                }
                  
              }
              }
        } 
        catch (error) {
            console.error('Error al obtener los articulos:', error);
            speechOutput =  errorFolio+error.message;

        }
        
        //speechOutput = folio;
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // generate the APL RenderDocument directive that will be returned from your skill
            const aplDirective = createDirectivePayload(DOCUMENT_ID[Apl], datasource);
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }
                
        return handlerInput.responseBuilder.
        speak(speechOutput)
        .reprompt(requestAttributes.t('CONTINUAROCERRAR'))
        .getResponse();
        
    
    }
}


/**********************AQUI SE REALIZA EL PROCESO DE AGENDAR LA CITA****************/
const agendarCitaHandler ={
    async canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'recibeDatosAgendar';
    },
    async handle(handlerInput) {
        const requestAttributes=handlerInput.attributesManager.getRequestAttributes();
        const fecha = handlerInput.requestEnvelope.request.intent.slots.fecha.value;
        const hora = handlerInput.requestEnvelope.request.intent.slots.hora.value;
        const terapia = handlerInput.requestEnvelope.request.intent.slots.terapia.value;
        const terapeuta = "Lizet Mendoza Redondo";
        const fecha2=fecha.toString()
        const hora2=hora.toString()
        const terapeuta2=2;
        let terapia2;
        let speakOutput2;
        let speakOutput3;
        if(terapia==="deportiva" || terapia==="sporty"){
            terapia2=1
        }else if(terapia==="geriatrica" || terapia==="geriátrica" || terapia==="geriatric"){
            terapia2=2
        }else if(terapia==="pulmonar" || terapia==="pulmonary"){
            terapia2=3
        }else if(terapia==="pediatrica" || terapia==="pediátrica" || terapia==="pediatric"){
            terapia2=4
        }
        let speakOutput;
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        let permisos = sessionAttributes['permisos'];
        if(permisos!=="1"){
            speakOutput=requestAttributes.t('MSGTERAPEUTA')
            datasource['mensajesComplementarios']['texto']=speakOutput;
        }else{
            let idU = sessionAttributes['id'];
            const {data} = await axios.post('https://prophysio.tagme.uno/public/api/agendarCita', {
                tipo: terapia2,
                terapeuta: terapeuta2,
                user: idU,
                fecha_inicio:fecha2 +' '+hora2
            });
            if(data==="0"){
                speakOutput=requestAttributes.t('FECHAHORA');
            }else{
                const folio=data['folio'];
                let folio2=folio.split("").join(", ");
                 speakOutput2=requestAttributes.t('MSGREGISTROCITA',fecha2,hora2,terapia,terapeuta,folio2);
                 speakOutput=speakOutput2+'. '+requestAttributes.t('EXTRA');
            }
            
        }
        datasource['mensajesComplementarios']['texto']=speakOutput2;
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // generate the APL RenderDocument directive that will be returned from your skill
            const aplDirective = createDirectivePayload(DOCUMENT_ID[6], datasource);
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(requestAttributes.t('CONTINUAROCERRAR'))
            .getResponse();
    }

}
/******************AQUI SE REALIZA EL PROCESO DE CONSULTAR QUE EL FOLIO COINCIDA PARA REAGENDAR LA CITA***************/
const validarFolioReagendar = {
     async canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'darFolioReagendar';
    },
    async handle(handlerInput) {
        const requestAttributes=handlerInput.attributesManager.getRequestAttributes();
        const noEncontrado=requestAttributes.t('FOLIONULL');
        const errorFolio=requestAttributes.t('ERRORFOLIO');
        const folioEncontrado=requestAttributes.t('FOLIOREAGENDARENCONTRADO');
        const folio = handlerInput.requestEnvelope.request.intent.slots.folio.value;
        const folio2 = folio.toString(); //'20230809190000718';
        const url = 'https://prophysio.tagme.uno/public/api/consultaCita?folio='+folio2;
        let speechOutput;
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        let permisos = sessionAttributes['permisos'];

        try {
             if(permisos!=="1"){
                speechOutput=requestAttributes.t('MSGTERAPEUTA')
                datasource['mensajesComplementarios']['texto']=speechOutput;
            }else{
              const response = await axios.get(url);
              const cita = response.data;
              if(!cita){
                datasource['mensajesComplementarios']['texto']=noEncontrado;
                speechOutput = noEncontrado;
              }else{
                datasource['mensajesComplementarios']['texto']=folioEncontrado;
                folioR=folio2;
                speechOutput = folioEncontrado;
              }
                
            }
        } 
        catch (error) {
            console.error('Error al obtener los articulos:', error);
            speechOutput =  errorFolio+error.message;
        }
        folioR=folio2;
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // generate the APL RenderDocument directive that will be returned from your skill
            const aplDirective = createDirectivePayload(DOCUMENT_ID[6], datasource);
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }
                
        return handlerInput.responseBuilder.
        speak(speechOutput)
        .reprompt('')
        .getResponse();
    }
}
/******************AQUI SE REALIZA EL PROCESO DE CANCELAR LA CITA**************/
const cancelarCitaHandler = {
     async canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'darfoliocancelar';
    },
    async handle(handlerInput) {
        const requestAttributes=handlerInput.attributesManager.getRequestAttributes();
        const noEncontrado=requestAttributes.t('FOLIONULL');
        const errorFolio=requestAttributes.t('ERRORFOLIO');
        const canceladoConExito=requestAttributes.t('FOLIOCANCELADOCONEXITO');
        const canceladoAtendido=requestAttributes.t('CANCELADAOATENDIDA');
        const folio = handlerInput.requestEnvelope.request.intent.slots.folio.value;
        const folio2 = folio.toString(); //'20230809190000718';
        //const url = 'https://prophysio.tagme.uno/public/api/consultaCita?folio='+folio2;
         const url='https://prophysio.tagme.uno/public/api/cancelarCita?folio='+folio2;
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        let permisos = sessionAttributes['permisos'];

        let speechOutput;
        try {
            if(permisos!=="1"){
                speechOutput=requestAttributes.t('MSGTERAPEUTA')
                datasource['mensajesComplementarios']['texto']=speechOutput;
            }else{
              const response = await axios.get(url);
              const cita = response.data;
              const resp=cita['response']
              if(resp==="0"){
                datasource['mensajesComplementarios']['texto']=noEncontrado;
                speechOutput = noEncontrado;
              }else if(resp==="1"){
                datasource['mensajesComplementarios']['texto']=canceladoAtendido;
                speechOutput=canceladoAtendido;
              }else if(resp==="2"){
                datasource['mensajesComplementarios']['texto']=canceladoConExito;
                speechOutput = canceladoConExito+'. '+requestAttributes.t('EXTRA');
              }
                
            }
        } 
        catch (error) {
            console.error('Error al obtener los articulos:', error);
            speechOutput =  errorFolio+error.message;
        }
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // generate the APL RenderDocument directive that will be returned from your skill
            const aplDirective = createDirectivePayload(DOCUMENT_ID[6], datasource);
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }
                
        return handlerInput.responseBuilder.
        speak(speechOutput)
        .reprompt(requestAttributes.t('CONTINUAROCERRAR'))
        .getResponse();
    }
}
/**********************************REAGENDAR LA CITA*************************************************************************************************************/
const reagendarLaCitaHandler = {
     async canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'recibeDatosReagendar';
    },
    async handle(handlerInput){
        const requestAttributes=handlerInput.attributesManager.getRequestAttributes();
        const fechaN = handlerInput.requestEnvelope.request.intent.slots.fecha.value;
        const horaN = handlerInput.requestEnvelope.request.intent.slots.hora.value;
        const msgNodisponible=requestAttributes.t('REAGENDARFECHAOCUPADA')
        const fechaN2=fechaN.toString()
        const horaN2=horaN.toString()
        let fecha2S=fechaN2+' '+horaN2;
        let speechOutput;
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        
        let permisos = sessionAttributes['permisos'];
        try {
             if(permisos!=="1"){
                speechOutput=requestAttributes.t('MSGTERAPEUTA')
                datasource['mensajesComplementarios']['texto']=speechOutput;
            }else{
                const apiUrl = `https://prophysio.tagme.uno/public/api/reagendarCita?folio=${folioR}&fecha=${fecha2S}`;
                const response = await axios.get(apiUrl);
                if(response.data['response']==="1"){
                    speechOutput=msgNodisponible
                    datasource['mensajesComplementarios']['texto']=speechOutput;
                }else if(response.data['response']==="3"){
                    let speechOutput2=requestAttributes.t('MSGREAGENDACITA',fechaN2,horaN2);
                    datasource['mensajesComplementarios']['texto']=speechOutput2;
                    speechOutput=speechOutput2+'. '+requestAttributes.t('EXTRA')
                    
                }
            }
        } 
        catch (error) {
            console.error('Error al obtener los articulos:', error);
            speechOutput =  error.message;
        }
         if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // generate the APL RenderDocument directive that will be returned from your skill
            const aplDirective = createDirectivePayload(DOCUMENT_ID[6], datasource);
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }
                
        return handlerInput.responseBuilder.
        speak(speechOutput)
        .reprompt(requestAttributes.t('CONTINUAROCERRAR'))
        .getResponse();
        
    }
}
//*** funcion para validar el token ***//
const validarTokenHandler ={
    async canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'darToken';
    },
    async handle(handlerInput) {
        const requestAttributes=handlerInput.attributesManager.getRequestAttributes();
        const token = handlerInput.requestEnvelope.request.intent.slots.token.value;
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const token2 = token.toString(); //'72305300';
        let msgbienvenida;
        const url = 'https://prophysio.tagme.uno/public/api/validarToken?token='+token2;
        let speechOutput;
        try {
              const response = await axios.get(url);
              const user = response.data;
        
              if(user['id']!==0) {
        
                //mandar datos al apl de que inicio sesion 
                
                
                //se guardan los datos del usuario y permisos
                permisos = user['permiso'];
                userId = user['id'];
                userNombre = user['nombre'];
                userCorreo = user['correo'];
                
                if(permisos==='1'){
                    sessionAttributes['permisos'] = permisos;
                    sessionAttributes['id'] = userId;
                    sessionAttributes['nombre'] = userNombre;
                    sessionAttributes['correo'] = userCorreo;
                    speechOutput = requestAttributes.t('BIENVENIDA',userNombre);
                    datasource['bienvenidaDatasource']['texto']=speechOutput;
                }  
                else if(permisos==='2'){
                    sessionAttributes['permisos'] = permisos;
                    sessionAttributes['id'] = userId;
                    sessionAttributes['nombre'] = userNombre;
                    sessionAttributes['correo'] = userCorreo;
                    speechOutput = requestAttributes.t('BIENVENIDAT',userNombre);
                    datasource['bienvenidaDatasource']['texto']=speechOutput;
              } 
              
        }else{
                    speechOutput = requestAttributes.t('TOKENINVALIDO');
                    datasource['bienvenidaDatasource']['texto']=speechOutput;
                    //speechOutput = folio;
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // generate the APL RenderDocument directive that will be returned from your skill
            const aplDirective = createDirectivePayload(DOCUMENT_ID[6], datasource);
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }
              } 
            
        }
        catch (error) {
            console.error('Error al validar el token:', error);
            speechOutput =  'Error al validar el token:'+error.message;

        }
        
        //speechOutput = folio;
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // generate the APL RenderDocument directive that will be returned from your skill
            const aplDirective = createDirectivePayload(DOCUMENT_ID[6], datasource);
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }
                
        return handlerInput.responseBuilder.
        speak(speechOutput)
        .reprompt(requestAttributes.t('MSGINI'))
        .getResponse();
        
    
    }
}
/*******************************************************CONSULTAR CITAS TERAPEUTA AQUI SE RECEIBE LA FECHA***********************************************************************************************************/
const mostrarCitasTerapeuta ={
    async canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'pedirFechaCitas';
    },
    async handle(handlerInput) {
        const requestAttributes=handlerInput.attributesManager.getRequestAttributes();
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const fecha = handlerInput.requestEnvelope.request.intent.slots.fecha.value;
        const fecha2 = fecha.toString(); 
        let permisos = sessionAttributes['permisos'];
        let ID = sessionAttributes['id'];
        let id2=ID.toString();
        let speechOutput = '';
        let salidaApl = '';
        try {
            if(permisos!=="2"){
                speechOutput=requestAttributes.t('MSGPACIENTE')
                datasource['mensajesComplementarios']['texto']=speechOutput;
            }else{
                const apiUrl = `https://prophysio.tagme.uno/public/api/consultaTerapeuta?id=${id2}&dia=${fecha2}`;
                const response = await axios.get(apiUrl);
                const citas = response.data;

                if(citas.length === 0){
                    speechOutput =requestAttributes.t('NINGUNA_CITA',{fecha:fecha2});
                    datasource['mensajesComplementarios']['texto'] = requestAttributes.t('NINGUNA_CITA',{fecha:fecha2});
                }
                else{
                    var nombresArray = [];
                    speechOutput = requestAttributes.t('CITAS',{fecha:fecha2,cant:citas.length});
                    salidaApl = requestAttributes.t('CITAS',{fecha:fecha2,cant:citas.length}) + '<br>';
                    // Recorrer el arreglo de objetos y extraer los nombres
                    for (var i = 0; i < citas.length; i++) {
                        var objeto = citas[i];
                        //var nombres = objeto.nombres;
                        //nombresArray.push(nombres);
                        // Convertir la cadena a un objeto Date
                        const fechaCita = new Date(objeto.fecha_inicio);
                        // Obtener la hora de la fecha
                        const hora = fechaCita.getHours();
                        // Obtener los minutos de la fecha (opcional, si también necesitas los minutos)
                        const minutos = fechaCita.getMinutes();
    
                        speechOutput+= hora + ':'+minutos+', ';
                        salidaApl+= hora + ':'+minutos+' con: '+ objeto.name +' <br> ';
                    }
                    datasource['mensajesComplementarios']['texto'] = salidaApl;
                }
            }
              
        } 
        catch (error) {
            console.error('Error:', error);
            speechOutput =  error.message;

        }
        
        //speechOutput = folio;
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // generate the APL RenderDocument directive that will be returned from your skill
            const aplDirective = createDirectivePayload(DOCUMENT_ID[6], datasource);
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }
                
        return handlerInput.responseBuilder.
        speak(speechOutput)
        .reprompt(requestAttributes.t('CONTINUAROCERRAR'))
        .getResponse();
        
    
    }
}
/*PEDIR REALIZAR CONSULTA*/
const consultaCitas = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'consultarCitaTerapeuta';
    },
    handle(handlerInput) {
        const requestAttributes=handlerInput.attributesManager.getRequestAttributes();
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        let permisos = sessionAttributes['permisos'];
        let speakOutput;
        let type;
        if(permisos!=="2"){
            speakOutput=requestAttributes.t('MSGPACIENTE')
            datasource['mensajesComplementarios']['texto']=speakOutput;
            type=6
        }else{
            const textoRound=requestAttributes.t('MSGCONSULTACITAS');
            speakOutput=requestAttributes.t('MSGCONSULTACITAS');
            datasource['mensajesComplementarios']['texto']=speakOutput
            type=4
        }
        
         if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // generate the APL RenderDocument directive that will be returned from your skill
            const aplDirective = createDirectivePayload(DOCUMENT_ID[6], datasource);
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(requestAttributes.t('MSGPEDIR'))
            .getResponse();
    }
} 
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const requestAttributes=handlerInput.attributesManager.getRequestAttributes();
        let ur="prophysio.tagme.uno"
        const speakOutput = requestAttributes.t('AYUDA')+' '+ur;
        datasource['ayudaData']['texto']=requestAttributes.t('AYUDA')
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // generate the APL RenderDocument directive that will be returned from your skill
            const aplDirective = createDirectivePayload(DOCUMENT_ID[1], datasource);
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const requestAttributes=handlerInput.attributesManager.getRequestAttributes();
        const speakOutput = requestAttributes.t('ADIOS');
        datasource['adiosData']['texto']=speakOutput
         if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // generate the APL RenderDocument directive that will be returned from your skill
            const aplDirective = createDirectivePayload(DOCUMENT_ID[3], datasource);
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const requestAttributes=handlerInput.attributesManager.getRequestAttributes();
        const speakOutput = requestAttributes.t('NOENTENDER');

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const LoggingRequestInterceptor = {
    process(handlerInput) {
        console.log(`Incoming request: ${JSON.stringify(handlerInput.requestEnvelope.request)}`)
    }
}

const LoggingResponseInterceptor = {
    process(handlerInput, response) {
        console.log(`Outgoing response: ${JSON.stringify(response)}`)
    }
}

const LocalizationInterceptor = {
  process(handlerInput) {
    const localizationClient = i18n.use(sprintf).init({
      lng: handlerInput.requestEnvelope.request.locale,
      fallbackLng: 'es',
      overloadTranslationOptionHandler: sprintf.overloadTranslationOptionHandler,
      resources: languageStrings,
      returnObjects: true
    });

    const attributes = handlerInput.attributesManager.getRequestAttributes();
    attributes.t = function (...args) {
      return localizationClient.t(...args);
    }
  }
}
const LoadAttributesRequestInterceptor = {
    async process(handlerInput) {
        if(handlerInput.requestEnvelope.session['new']){ //is this a new session?
            const {attributesManager} = handlerInput;
            const persistentAttributes = await attributesManager.getPersistentAttributes() || {};
            //copy persistent attribute to session attributes
            handlerInput.attributesManager.setSessionAttributes(persistentAttributes);
        }
    }
};

const SaveAttributesResponseInterceptor = {
    async process(handlerInput, response) {
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const shouldEndSession = (typeof response.shouldEndSession === "undefined" ? true : response.shouldEndSession);//is this a session end?
        if(shouldEndSession || handlerInput.requestEnvelope.request.type === 'SessionEndedRequest') { // skill was stopped or timed out            
            attributesManager.setPersistentAttributes(sessionAttributes);
            await attributesManager.savePersistentAttributes();
        }
    }
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        blogHandler,
        datosReagendarCitaHandler,
        mostrarNuevamenteHandler,
        validarFolioReagendar,
        reagendarLaCitaHandler,
        mostrarCitasTerapeuta,
        datosCitaHandler,
        agendarCitaHandler,
        cancelarCitaHandler,
        consultaCitas,
        datosCancelarCitaHandler,
        folioHandler,
        validarTokenHandler,
        mostrarcitaHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .addRequestInterceptors(
            LoadAttributesRequestInterceptor)
    .addResponseInterceptors(
            SaveAttributesResponseInterceptor)
    .addRequestInterceptors(LoggingRequestInterceptor, LocalizationInterceptor)
    .addResponseInterceptors(LoggingResponseInterceptor)
    .withPersistenceAdapter(persistenceAdapter)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();