/**
 * @author Ayman Habib
 */
THREE.SkinnedMuscle = function(geom, points, material) {
    // Create bones for uuids in geometryPath
    this.pathpoints = points;
    this.pathpointObjects = [];
    geom.bones = [];

    for (var i=0; i< 2*points.length-2; i++) {
        var bone = new THREE.Bone();
        bone.pos = [0, 0, 0];
        bone.rotq = [0, 0, 0, 1];
        bone.ppt = this.pathpoints[Math.floor(i/2)];
        geom.bones.push(bone);
    }

    var numVerticesPerLevel = geom.vertices.length / (2*points.length-2);

    for ( var i = 0; i < geom.vertices.length; i++ ) {
        var skinIndex = Math.floor(i / numVerticesPerLevel);
        geom.skinIndices.push(new THREE.Vector4(skinIndex, skinIndex+1, skinIndex-1, 0));
        if(skinIndex > 0 && skinIndex < geom.bones.length-1) {
           // blend next and previous bone vertices to smoothen transitions
            geom.skinWeights.push( new THREE.Vector4( 0.8, 0.1, 0.1, 0 ) );
        }
        else { //but, strictly enforce the reaching of the end points
            geom.skinWeights.push( new THREE.Vector4( 1.0, 0, 0, 0 ) );
        }
    }
    geom.dynamic = true;
    THREE.SkinnedMesh.call( this, geom );
    this.material = material;
    this.material.skinning = true;
};

THREE.SkinnedMuscle.prototype = Object.create( THREE.SkinnedMesh.prototype );
THREE.SkinnedMuscle.prototype.constructor = THREE.SkinnedMuscle;

THREE.SkinnedMuscle.prototype.updateMatrixWorld = function( force ) {
// if has pathpoints attribute then it's a muscle
// Cycle through pathpoints, update their matrixworld
// then set the position of the Bones from that
    if (this.skeleton === undefined)
        return;
    var bones = this.skeleton.bones;
    //console.warn("Num bones in updateMatrixWorld: " + bones.length);

    if (this.pathpointObjects.length != this.pathpoints.length){
        var b = 0;
        for ( var p=0; p < this.pathpoints.length; p++) {
            var pptObject1 = editor.objectByUuid(this.pathpoints[p]);
            var pptObject2 = editor.objectByUuid(this.pathpoints[p+1]);

            if (pptObject1 !== undefined) {
               // add every pathpoint to the list of PathPoint objects
                this.pathpointObjects.push(pptObject1);

                if (pptObject2 !== undefined) {
                // define the two bones of a segement of the path together
                    bones[b].geometry = pptObject1.geometry;
                    bones[++b].geometry = pptObject2.geometry;
                }
                b++;
            }
        }
    }
    // Compute reverse transform from Ground to Scene (usually this's inverse translation)
    // This is necessary since the blending to compute vertices adds offset twice
    var mat = new THREE.Matrix4().getInverse(this.parent.matrixWorld);
    var vec = new THREE.Vector3().setFromMatrixPosition(mat);

    // Variables for the two points of a given path segement, the axis to
    // be rotated (from) and the vector between them (to)
    var pt1 = new THREE.Vector3();
    var pt2 = new THREE.Vector3();
    var vFrom = new THREE.Vector3(0, -1, 0);
    var vTo = new THREE.Vector3();

    // cycle through each segement defined by two PathPoints, pt1 and pt2
    // and alignge the bones (caps of each segment) to be alinged with
    // the vector connecting them.
    var b = 0; // bone (of SkinnedMuscle) index
    for (var p = 0; p < this.pathpoints.length-1; p++) {
        var thisPathpointObject = this.pathpointObjects[p];
        var nextPathpointObject = this.pathpointObjects[p+1];

        if(thisPathpointObject !== undefined) {
            pt1.setFromMatrixPosition(thisPathpointObject.matrixWorld);
            pt2.setFromMatrixPosition(nextPathpointObject.matrixWorld);

            vTo = pt2.clone();
            vTo.sub(pt1).normalize();

            // bones are positioned on the pathpoints
            bones[b].position.setFromMatrixPosition(thisPathpointObject.matrixWorld);
            bones[b].position.add(vec);
            // the orientation of the bone is updated to have its Y-axis pointed
            // back along the vector from pt1 to pt2
            bones[b].quaternion.setFromUnitVectors(vFrom, vTo);

            bones[++b].position.setFromMatrixPosition(nextPathpointObject.matrixWorld);
            // the orientation of the bone is updated to have its Y-axis pointed
            // back along the vector from pt1 to pt2
            bones[b].position.add(vec);
            bones[b++].quaternion.setFromUnitVectors(vFrom, vTo);
        }
    }
    this.skeleton.update();
    THREE.SkinnedMesh.prototype.updateMatrixWorld.call( this, true );
};
