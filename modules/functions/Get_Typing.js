module.exports = async (MAIN, object, unicode, server) => {
  return new Promise(resolve => {
    let typing = {
      type: '',
      type_noemoji: '',
      color: '',

      weaknesses: '',
      resistances: '',
      reduced: ''
    }
    let type_name = '', types = [];

    // DEFINE GLOBAL
    if(object.pokemon_id && MAIN.masterfile.pokemon[object.pokemon_id]){
      // GET DEFAULT FORM NUMBER IF A PROPER FORM ISN'T PASSED
      if(object.form == undefined && MAIN.masterfile.pokemon[object.pokemon_id].default_form){
        object.form = MAIN.masterfile.pokemon[object.pokemon_id].default_form;
      }

      // FORM TYPES OR SPECIES TYPE
      if (object.form && object.form > 0 && !MAIN.masterfile.pokemon[object.pokemon_id].types){
        types = MAIN.masterfile.pokemon[object.pokemon_id].forms[object.form].types;
      } else{
        types = MAIN.masterfile.pokemon[object.pokemon_id].types
      } if(!types){
        console.error('[masterfile.json] Missing type info for '+object.pokemon_id);
      }
    }

    switch (server.language) {
      // DE LANGUAGE SUPPORT
      case 'de':
        if(object.pokemon_id && MAIN.masterfile.pokemon[object.pokemon_id]){
          // GET TYPE, COLOR, WEAKNESSES AND RESISTANCES FOR POKEMON WITH FORM TYPE
          types.forEach((type) => {
            for (key in MAIN.proto.values) {
              if(MAIN.proto.values[key] === type){
                type_name = MAIN.de.values[key];
              }
            }

            if(unicode){
              typing.type += MAIN.unicode[type]+' '+type_name+' / ';
            } else{ typing.type += MAIN.emotes[type.toLowerCase()]+' '+type_name+' / '; }

            typing.type_noemoji += type_name+' / ';
            typing.color = MAIN.Type_Color(MAIN, type, typing.color);
            types.forEach((type2) => {
              MAIN.types[type].resistances.forEach((resistance,index) => {
                MAIN.types[type].weaknesses.forEach((weakness,index) => {
                  if (MAIN.types[type2].resistances.indexOf(weakness) >= 0){typing.reduced += weakness+','}
                  if(typing.weaknesses.indexOf(MAIN.emotes[weakness.toLowerCase()]) < 0 && typing.reduced.indexOf(weakness) < 0){
                    typing.weaknesses += MAIN.emotes[weakness.toLowerCase()]+' ';
                  }
                  if(typing.resistances.indexOf(MAIN.emotes[resistance.toLowerCase()]) < 0 && MAIN.types[type2].weaknesses.indexOf(resistance) < 0){
                    typing.resistances += MAIN.emotes[resistance.toLowerCase()]+' ';
                  }
                });
              });
            });
          });
        }
        break;


      // EN LANGUAGE SUPPORT
      default:
        if(object.pokemon_id && MAIN.masterfile.pokemon[object.pokemon_id]){
          types.forEach((type) => {
            type_name = type;

            if(unicode){
              typing.type += MAIN.unicode[type]+' '+type_name+' / ';
            } else{ typing.type += MAIN.emotes[type.toLowerCase()]+' '+type_name+' / '; }

            typing.type_noemoji += type_name+' / ';
            typing.color = MAIN.Type_Color(MAIN, type, typing.color);
            types.forEach((type2) => {
              MAIN.types[type].resistances.forEach((resistance,index) => {
                MAIN.types[type].weaknesses.forEach((weakness,index) => {
                  if (MAIN.types[type2].resistances.indexOf(weakness) >= 0){typing.reduced += weakness+','}
                  if(typing.weaknesses.indexOf(MAIN.emotes[weakness.toLowerCase()]) < 0 && typing.reduced.indexOf(weakness) < 0){
                    typing.weaknesses += MAIN.emotes[weakness.toLowerCase()]+' ';
                  }
                  if(typing.resistances.indexOf(MAIN.emotes[resistance.toLowerCase()]) < 0 && MAIN.types[type2].weaknesses.indexOf(resistance) < 0){
                    typing.resistances += MAIN.emotes[resistance.toLowerCase()]+' ';
                  }
                });
              });
            });
          });
        }
    }
    // REMOVE EXTRA CHARACTERS FROM END OF VARIABLES
    typing.type = typing.type.slice(0,-3);
    typing.type_noemoji = typing.type_noemoji.slice(0,-3);
    typing.weaknesses = typing.weaknesses.slice(0,-1);
    typing.resistances = typing.resistances.slice(0,-1);

    return resolve(typing);
  });
}
