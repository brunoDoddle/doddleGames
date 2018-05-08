var myLoader = {
}
 
// Initialistaion
myLoader.init = function(onLoadGlobalCallBack, onProgressGlobalCallBack){
    this.context = null;
    this.defaultGroupName = "_defaultGroupName";
    this.allGroupName = "_allGroupName";
    this.group = {};
    this.onLoadCallBack = {};
    this.onProgressCallBack = {};
 
    if (onLoadGlobalCallBack!=undefined) myLoader.addOnLoadGroup(onLoadGlobalCallBack,this.allGroupName )
    if (onProgressGlobalCallBack!=undefined) myLoader.addOnProgressGroup(onProgressGlobalCallBack,this.allGroupName )
}

myLoader.setAudioContext = function(context){
    if (context!=undefined)
        this.context = context;
    else {
        if (typeof AudioContext == "function") {
            this.context = new AudioContext();
        } else if (typeof webkitAudioContext == "function") {
            this.context = new webkitAudioContext();
        }
    }
}

myLoader.addOnLoadGroup = function(onLoadCallBack,key){
    if (key==undefined) key = myLoader.defaultGroupName;
    this.onLoadCallBack[key] = onLoadCallBack;
}
 
myLoader.addOnProgressGroup = function(onProgressCallBack,key){
    if (key==undefined) key = myLoader.defaultGroupName;
    this.onProgressCallBack[key] = onProgressCallBack;
}
 
// Cherche si la ressource demandé est disponible
myLoader.getRessource = function(id,key) {
    if (key==undefined) key = myLoader.defaultGroupName;
    var test = this.verifyList(this.group[key],id);
    if (test!=-1) {
        if (!this.group[key][test].loaded) {
            console.error('Ressources not yet loaded (or in error?) ' +  id + ' in group ' + key);
            return null
        }
        return this.group[key][test].data;
    }
    console.error('No ressources named ' +  id + ' in group ' + key);
    return null;
}
 
// Ajoute une image
myLoader.addImage = function(id,url,group){
    if (!this.addGroup(id,url,"I",group)) console.error('Image ressource name twice : ' +  id + ' in ' + group);
}
 
// Ajoute un son
myLoader.addSound = function (id,url,group){
    if (!this.addGroup(id,url,"S",group)) console.error('Sound ressource name twice : ' +  id + ' in ' + group);
}
 
// Ajoute un texte
myLoader.addText = function (id,url,group){
    if (!this.addGroup(id,url,"T",group)) console.error('Text ressource name twice : ' +  id + ' in ' + group);
}
 
// Ajoute un XML
myLoader.addXml = function (id,url,group){
    if (!this.addGroup(id,url,"X",group)) console.error('XML ressource name twice : ' +  id + ' in ' + group);
}
 
// Ajoute un groupe
myLoader.addGroup = function(id,url,type,key) {
    // Si pas de goupe on met dans le groupe commun
    if (key==undefined) key = myLoader.defaultGroupName;
    // Si le groupe demandé n'existe pas on le cré
    if (this.group[key]==null) this.group[key] = new Array();
    if (this.verifyList(this.group[key],id)==-1){
        this.group[key].push({'id':id,'url':url,'type':type,'data':null,'loaded':false});
        this.group[key].loadCount = 0;
        return true;
    } else return false;
}
 
// Verifie si un élément(id) est déja présent dans la liste
myLoader.verifyList = function(list,id){
    for(var i=0;i < list.length; i++) if (list[i].id == id) return i;
    return -1;
}
 
// Demmarage du chargement de tout en même temps
myLoader.load = function(){
    for(key in this.group) myLoader.loadGroup(key);
}
 
// Demmarage du chargement d'un groupe
myLoader.loadGroup = function(key){
    for (var i = 0; i < this.group[key].length; i++) {
        switch(this.group[key][i].type){
            case "I" : this.loadImage(key,i);break;
            case "S" : this.loadSound(key,i);break;
            case "T" : this.loadText(key,i);break;
            case "X" : this.loadXml(key,i);break;
            default :
                console.error('Unknown type ' + this.group[key][i].type) + ' for id '+this.group[key][i].id;
                return;
                break;
        }
    }
}
 
// Vérifie si un groupe est entièrement chargé
myLoader.groupLoaded = function (key){
    return {'loaded':this.group[key].length == this.group[key].loadCount ? true : false,'total':this.group[key].length,'cpt':this.group[key].loadCount};
}
 
// Vérifie si tous les groupes sont chargé
myLoader.allGroupLoaded = function () {
    var infoGroup,total=0,cpt=0;
    for(key in this.group) {
        infoGroup = this.groupLoaded(key);
        total += infoGroup.total;   // Et on cumul les infos du group
        cpt += infoGroup.cpt;
    }
    return {'loaded':total == cpt ? true : false,'total':total,'cpt':cpt};
}
 
myLoader.testCallBack = function(key,index){
    ++this.group[key].loadCount;    // On augmente le nombre de chargé dans le groupe courant
   
    //Les CallBack personnalisés
    // On appel déja le progress, sinon il ecrasera le onLoad ce qui est con...
    if (this.onProgressCallBack.hasOwnProperty(key)){  // On vérifie si un callBack a été mis en place...
        this.onProgressCallBack[key]({'count':this.group[key].loadCount,'id':this.group[key][index].id,'total':this.group[key].length});
    }
    if (this.onLoadCallBack.hasOwnProperty(key)){  // On vérifie si un callBack a été mis en place...
        if (this.group[key].loadCount == this.group[key].length){  // Le group est chargé
            this.onLoadCallBack[key]({'count':this.group[key].loadCount,'id':this.group[key][index].id,'total':this.group[key].length});
        }
    }
 
    //Les CallBack généraux
    // Pareil progress first....
    if (this.onProgressCallBack.hasOwnProperty(this.allGroupName )){  // On vérifie si un callBack a été mis en place...
        var a = this.allGroupLoaded();
        this.onProgressCallBack[this.allGroupName ]({'count':a.cpt,'id':this.group[key][index].id,'total':a.total});
    }
    if (this.onLoadCallBack.hasOwnProperty(this.allGroupName)){  // On vérifie si un callBack a été mis en place...
        var a = this.allGroupLoaded();
        if (a.loaded){  // Les groupes sont chargés
            this.onLoadCallBack[this.allGroupName]({'count':a.cpt,'id':this.group[key][index].id,'total':a.total});
       }
    }
}
 
// Chargement spécial image, le plus simple
myLoader.loadImage = function(key,index){
    var loader = this;
    var img = new Image();
 
    img.src = loader.group[key][index].url;
   
    img.onload = function(){
        // SI c'est chargé on met les datas dans l'images
        loader.group[key][index].data = img;
        loader.group[key][index].loaded = true;
        myLoader.testCallBack(key,index);
    }
}
 
// Chargement spécial sons, pas plus compliqué mais necessite un context, donc ne marche que sur webkit...
myLoader.loadSound = function (key,index){
    var loader = this;
    var request = new XMLHttpRequest();
 
    request.open("GET", loader.group[key][index].url, true);
    request.responseType = "arraybuffer";
  
    request.onload = function() {
      loader.context.decodeAudioData(
        request.response,
        function(buffer) {
            if (!buffer) {
                console.error('error decoding file data: ' + loader.group[key][index].url);
                return;
            }
            loader.group[key][index].data = buffer;
            loader.group[key][index].loaded = true;
            myLoader.testCallBack(key,index);
            },
        function(error) {
            console.error('decodeAudioData error', error);
        }
      );
    }
 
    request.onerror = function() {
        console.error('error loading file data: ' + loader.group[key][index].url);
    }
    request.send();
}
 
// Chargement spécial Texte plutôt simple aussi
myLoader.loadText = function (key,index){
    var loader = this;
    var request = new XMLHttpRequest();
 
    request.open("GET", loader.group[key][index].url, true);
    request.responseType = "text";
  
    request.onload = function() {
        loader.group[key][index].data = request.responseText;
        loader.group[key][index].loaded = true;
        myLoader.testCallBack(key,index);
    }
 
    request.onerror = function() {
        console.error('error loading file data: ' + loader.group[key][index].url);
    }
    request.send();
}

// Chargement spécial XML plutôt simple aussi
myLoader.loadXml = function (key,index){
    var loader = this;
    var request = new XMLHttpRequest();
 
    request.open("GET", loader.group[key][index].url, true);
    request.responseType = "text";
  
    request.onload = function() {
	if (window.DOMParser){
	    parser=new DOMParser();
	    xmlDoc=parser.parseFromString(request.responseText,"text/xml");
	}else {
	    xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
	    xmlDoc.async="false";
	    xmlDoc.loadXML(request.responseText);
        }
        
        loader.group[key][index].data = xmlDoc;
        loader.group[key][index].loaded = true;
        myLoader.testCallBack(key,index);
    }
 
    request.onerror = function() {
        console.error('error loading file data: ' + loader.group[key][index].url);
    }
    request.send();
}