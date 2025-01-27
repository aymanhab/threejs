/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
/* NOWEBSOCKET
var wsUri = "ws://" + document.location.host + "/visEndpoint";
var websocket = new WebSocket(wsUri);
*/
var processing = false;
var last_message_uuid = 0;
/* NOWEBSOCKET
websocket.onerror = function(evt) { onError(evt) };

function onError(evt) {

}

websocket.onopen = function(evt) { onOpen(evt) };
*/
function writeToScreen(message) {

};

function onOpen() {

}
/* NOWEBSOCKET
websocket.onmessage = function(evt) { onMessage(evt) };
*/
function sendText(json) {
	//console.log("sending text: " + json);
	/* NOWEBSOCKET
	websocket.send(json);
	*/
}
				
async function onMessage(evt) {
	// console.log("received: " + evt.data);
	var msg = JSON.parse(evt.data);

	switch(msg.Op){
	case "Select":
		editor.selectByUuid( msg.UUID);
		break;
	case "Deselect":
		editor.deselect();
		break;
	case "Frame":  
		if (processing)
			return;
		if (msg.message_uuid === last_message_uuid)
			return;
		last_message_uuid = msg.message_uuid;
		//console.log("frame timestamp: " + msg.time);
		processing = true;
		var t0 = performance.now();
		// Make sure nothing is selected before applying Frame
		editor.select( null);
		var transforms = msg.Transforms;
		for (var i = 0; i < transforms.length; i ++ ) {
			var oneBodyTransform = transforms[i];
			var o = editor.objectByUuid( oneBodyTransform.uuid);
			//alert("mat before: " + o.matrix);
			if (o != undefined) {
				o.matrixAutoUpdate = false;
				o.matrix.fromArray(oneBodyTransform.matrix);
			}
		}
		var paths = msg.paths;
		if (paths !== undefined){
			for (var p=0; p < paths.length; p++ ) {
				editor.updatePath(paths[p]);
			}
		}
		if (msg.render===true) // not undefined
			editor.refresh();
		var t1 = performance.now() - t0;
		//console.log("frame time: " + t1);
		processing = false;
		break;
	case "CloseModel":
		modeluuid = msg.UUID;
		editor.closeModel(modeluuid);
		editor.refresh();
		break;
	case "OpenModel":
		var modeluuid = msg.UUID;
		if (editor.models.indexOf(modeluuid)===-1){
			editor.loadModel(modeluuid.substring(0,8)+'.json');
			editor.refresh();
		}
		break;
	case "SetCurrentModel":
		modeluuid = msg.UUID;
		editor.setCurrentModel(modeluuid);
		editor.refresh();
		break;
	case "execute":
		//msg.command.object = editor.objectByUuid(msg.UUID);
		if (msg.message_uuid !== last_message_uuid){
			editor.executeCommandJson(msg);
			editor.refresh();
			last_message_uuid = msg.message_uuid;
		}
		break; 
	case "addModelObject":
		editor.executeCommandJson(msg);
		let parentUuid = msg.command.object.object.parent;
		let cmd = msg.command;
		let newUuid = cmd.objectUuid;
        editor.moveObject(editor.objectByUuid(newUuid), editor.objectByUuid(parentUuid));
        if (msg.command.bbox !== undefined) {
            // update models bounding box with bbox;
            editor.updateModelBBox(msg.command.bbox);
        }
		editor.refresh();
		break;
	case "ReplaceGeometry":
		editor.replaceGeometry(msg.geometries, msg.uuid);
		break;
	case "PathOperation":
		if (msg.message_uuid !== last_message_uuid){
			editor.processPathEdit(msg);
			last_message_uuid = msg.message_uuid;
		}
		break;
	case "TogglePathPoints":
		editor.togglePathPoints(msg.uuid, msg.newState);
		break;
	case "scaleGeometry":
		editor.scaleGeometry(msg);
		break;
	case "startAnimation":
        editor.reportframeTime=true;
		break;
	case "endAnimation":
		// Sending any messages during handling a message causes problems, use callbacks only
		break;
	case "getOffsets":
		sendText(editor.getModelOffsetsJson());
		break;
    }
    processing = false; // Defensive in case render never finishes/errors
}
// End test functions

export {sendText};
