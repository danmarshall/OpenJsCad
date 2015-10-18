/**
 * @author mrdoob / http://mrdoob.com/
 */

var _Math = Math;

module THREE {
    export function SpriteCanvasMaterial(parameters?): void {

        Material.call(this);

        this.type = 'SpriteCanvasMaterial';

        this.color = new Color(0xffffff);
        this.program = function (context, color) { };

        this.setValues(parameters);

    }

    SpriteCanvasMaterial.prototype = Object.create(Material.prototype);
    SpriteCanvasMaterial.prototype.constructor = SpriteCanvasMaterial;

    SpriteCanvasMaterial.prototype.clone = function () {

        var material = new SpriteCanvasMaterial();

        Material.prototype.clone.call(this, material);

        material.color.copy(this.color);
        material.program = this.program;

        return material;

    };

    export interface ICanvasRendererOptions {
        canvas?: HTMLCanvasElement;
        alpha?: boolean;
    }

    export class CanvasRenderer implements Renderer {
        public domElement: HTMLCanvasElement;

        private pixelRatio = 1;
        private autoClear = true;
        private sortObjects = true;
        private sortElements = true;
        private info = {
            render: {
                vertices: 0,
                faces: 0
            }
        }
        private _projector = new Projector();
        private _renderData;
        private _elements;
        private _lights;
        private _canvas: HTMLCanvasElement;
        private _canvasWidth: number;
        private _canvasHeight: number;
        private _canvasWidthHalf: number;
        private _canvasHeightHalf: number;
        private _viewportX = 0;
        private _viewportY = 0;
        private _viewportWidth: number;
        private _viewportHeight: number;
        private _context: CanvasRenderingContext2D;
        private _clearColor = new Color(0x000000);
        private _clearAlpha: number;
        private _contextGlobalAlpha = 1;
        private _contextGlobalCompositeOperation = 0;
        private _contextStrokeStyle: string;
        private _camera: PerspectiveCamera;
        private _contextFillStyle;
        private _contextLineWidth;
        private _contextLineCap;
        private _contextLineJoin;
        private _contextLineDash;
        private _v1; 
        private _v2; 
        private _v3; 
        private _v4;
        private _v5 = new RenderableVertex();
        private _v6 = new RenderableVertex();

        private _v1x; 
        private _v1y; 
        private _v2x; 
        private _v2y; 
        private _v3x; 
        private _v3y;
        private _v4x; 
        private _v4y; 
        private _v5x; 
        private _v5y; 
        private _v6x; 
        private _v6y;

        private _color = new Color();
        private _color1 = new Color();
        private _color2 = new Color();
        private _color3 = new Color();
        private _color4 = new Color();

        private _diffuseColor = new Color();
        private _emissiveColor = new Color();

        private _lightColor = new Color();

        private _patterns = {};

        private _image; 
        private _uvs;
        private _uv1x; 
        private _uv1y; 
        private _uv2x; 
        private _uv2y; 
        private _uv3x; 
        private _uv3y;

        private _clipBox = new Box2();
        private _clearBox = new Box2();
        private _elemBox = new Box2();

        private _ambientLight = new Color();
        private _directionalLights = new Color();
        private _pointLights = new Color();

        private _vector3 = new Vector3(); // Needed for PointLight
        private _centroid = new Vector3();
        private _normal = new Vector3();
        private _normalViewMatrix = new Matrix3();

        constructor(parameters: ICanvasRendererOptions) {

            console.log('THREE.CanvasRenderer', REVISION);

            parameters = parameters || {};

            this._canvas = parameters.canvas !== undefined
                ? parameters.canvas
                : document.createElement('canvas'),

            this._canvasWidth = this._canvas.width,
            this._canvasHeight = this._canvas.height,
            this._canvasWidthHalf = _Math.floor(this._canvasWidth / 2),
            this._canvasHeightHalf = _Math.floor(this._canvasHeight / 2),

            this._viewportWidth = this._canvasWidth,
            this._viewportHeight = this._canvasHeight,

            this._context = <CanvasRenderingContext2D>this._canvas.getContext('2d', {
                alpha: parameters.alpha === true
            }),

            this._clearAlpha = parameters.alpha === true ? 0 : 1;
            this._contextStrokeStyle = null;
            this._contextFillStyle = null;
            this._contextLineWidth = null;
            this._contextLineCap = null;
            this._contextLineJoin = null;
            this._contextLineDash = [];

            // dash+gap fallbacks for Firefox and everything else

            if (this._context.setLineDash === undefined) {

                this._context.setLineDash = function () { }

            }

            this.domElement = this._canvas;
        }

        // WebGLRenderer compatibility
        supportsVertexTextures () { }
        setFaceCulling = function () { }

        //

        getPixelRatio () {
            return this.pixelRatio;
        }

        setPixelRatio (value) {
            this.pixelRatio = value;
        }

        setSize (width, height, updateStyle) {

            this._canvasWidth = width * this.pixelRatio;
            this._canvasHeight = height * this.pixelRatio;

            this._canvas.width = this._canvasWidth;
            this._canvas.height = this._canvasHeight;

            this._canvasWidthHalf = _Math.floor(this._canvasWidth / 2);
            this._canvasHeightHalf = _Math.floor(this._canvasHeight / 2);

            if (updateStyle !== false) {

                this._canvas.style.width = width + 'px';
                this._canvas.style.height = height + 'px';

            }

            this._clipBox.min.set(-this._canvasWidthHalf, -this._canvasHeightHalf),
            this._clipBox.max.set(this._canvasWidthHalf, this._canvasHeightHalf);

            this._clearBox.min.set(- this._canvasWidthHalf, - this._canvasHeightHalf);
            this._clearBox.max.set(this._canvasWidthHalf, this._canvasHeightHalf);

            this._contextGlobalAlpha = 1;
            this._contextGlobalCompositeOperation = 0;
            this._contextStrokeStyle = null;
            this._contextFillStyle = null;
            this._contextLineWidth = null;
            this._contextLineCap = null;
            this._contextLineJoin = null;

            this.setViewport(0, 0, width, height);

        }

        setViewport (x, y, width, height) {

            this._viewportX = x * this.pixelRatio;
            this._viewportY = y * this.pixelRatio;

            this._viewportWidth = width * this.pixelRatio;
            this._viewportHeight = height * this.pixelRatio;

        }

        setScissor () { }
        enableScissorTest () { }

        setClearColor (color, alpha) {

            this._clearColor.set(color);
            this._clearAlpha = alpha !== undefined ? alpha : 1;

            this._clearBox.min.set(- this._canvasWidthHalf, - this._canvasHeightHalf);
            this._clearBox.max.set(this._canvasWidthHalf, this._canvasHeightHalf);

        }

        setClearColorHex (hex, alpha) {

            console.warn('THREE.CanvasRenderer: .setClearColorHex() is being removed. Use .setClearColor() instead.');
            this.setClearColor(hex, alpha);

        }

        getClearColor () {

            return this._clearColor;

        }

        getClearAlpha () {

            return this._clearAlpha;

        }

        getMaxAnisotropy () {

            return 0;

        }

        clear () {

            if (this._clearBox.empty() === false) {

                this._clearBox.intersect(this._clipBox);
                this._clearBox.expandByScalar(2);

                this._clearBox.min.x = this._clearBox.min.x + this._canvasWidthHalf;
                this._clearBox.min.y = - this._clearBox.min.y + this._canvasHeightHalf;		// higher y value !
                this._clearBox.max.x = this._clearBox.max.x + this._canvasWidthHalf;
                this._clearBox.max.y = - this._clearBox.max.y + this._canvasHeightHalf;		// lower y value !

                if (this._clearAlpha < 1) {

                    this._context.clearRect(
                        this._clearBox.min.x | 0,
                        this._clearBox.max.y | 0,
                        (this._clearBox.max.x - this._clearBox.min.x) | 0,
                        (this._clearBox.min.y - this._clearBox.max.y) | 0
                        );

                }

                if (this._clearAlpha > 0) {

                    this.setBlending(NormalBlending);
                    this.setOpacity(1);

                    this.setFillStyle('rgba(' + _Math.floor(this._clearColor.r * 255) + ',' + _Math.floor(this._clearColor.g * 255) + ',' + _Math.floor(this._clearColor.b * 255) + ',' + this._clearAlpha + ')');

                    this._context.fillRect(
                        this._clearBox.min.x | 0,
                        this._clearBox.max.y | 0,
                        (this._clearBox.max.x - this._clearBox.min.x) | 0,
                        (this._clearBox.min.y - this._clearBox.max.y) | 0
                        );

                }

                this._clearBox.makeEmpty();

            }

        }
        
            // compatibility

        clearColor () { }
        clearDepth () { }
        clearStencil () { }

        public render(scene: Scene, camera: Camera, renderTarget?: RenderTarget, forceClear?: boolean): void {

            if (camera instanceof Camera === false) {

                console.error('THREE.CanvasRenderer.render: camera is not an instance of THREE.Camera.');
                return;

            }

            if (this.autoClear === true) this.clear();

            this.info.render.vertices = 0;
            this.info.render.faces = 0;

            this._context.setTransform(this._viewportWidth / this._canvasWidth, 0, 0, - this._viewportHeight / this._canvasHeight, this._viewportX, this._canvasHeight - this._viewportY);
            this._context.translate(this._canvasWidthHalf, this._canvasHeightHalf);

            this._renderData = this._projector.projectScene(scene, camera, this.sortObjects, this.sortElements);
            this._elements = this._renderData.elements;
            this._lights = this._renderData.lights;
            this._camera = <PerspectiveCamera>camera;

            this._normalViewMatrix.getNormalMatrix(camera.matrixWorldInverse);

            /* DEBUG
            setFillStyle( 'rgba( 0, 255, 255, 0.5 )' );
            _context.fillRect( _clipBox.min.x, _clipBox.min.y, _clipBox.max.x - _clipBox.min.x, _clipBox.max.y - _clipBox.min.y );
            */

            this.calculateLights();

            for (var e = 0, el = this._elements.length; e < el; e++) {

                var element = this._elements[e];

                var material = element.material;

                if (material === undefined || material.opacity === 0) continue;

                this._elemBox.makeEmpty();

                if (element instanceof RenderableSprite) {

                    this._v1 = element;
                    this._v1.x *= this._canvasWidthHalf; this._v1.y *= this._canvasHeightHalf;

                    this.renderSprite(this._v1, element, material);

                } else if (element instanceof RenderableLine) {

                    this._v1 = element.v1; this._v2 = element.v2;

                    this._v1.positionScreen.x *= this._canvasWidthHalf; this._v1.positionScreen.y *= this._canvasHeightHalf;
                    this._v2.positionScreen.x *= this._canvasWidthHalf; this._v2.positionScreen.y *= this._canvasHeightHalf;

                    this._elemBox.setFromPoints([
                        this._v1.positionScreen,
                        this._v2.positionScreen
                    ]);

                    if (this._clipBox.isIntersectionBox(this._elemBox) === true) {

                        this.renderLine(this._v1, this._v2, element, material);

                    }

                } else if (element instanceof RenderableFace) {

                    this._v1 = element.v1; this._v2 = element.v2; this._v3 = element.v3;

                    if (this._v1.positionScreen.z < - 1 || this._v1.positionScreen.z > 1) continue;
                    if (this._v2.positionScreen.z < - 1 || this._v2.positionScreen.z > 1) continue;
                    if (this._v3.positionScreen.z < - 1 || this._v3.positionScreen.z > 1) continue;

                    this._v1.positionScreen.x *= this._canvasWidthHalf; this._v1.positionScreen.y *= this._canvasHeightHalf;
                    this._v2.positionScreen.x *= this._canvasWidthHalf; this._v2.positionScreen.y *= this._canvasHeightHalf;
                    this._v3.positionScreen.x *= this._canvasWidthHalf; this._v3.positionScreen.y *= this._canvasHeightHalf;

                    if (material.overdraw > 0) {

                        this.expand(this._v1.positionScreen, this._v2.positionScreen, material.overdraw);
                        this.expand(this._v2.positionScreen, this._v3.positionScreen, material.overdraw);
                        this.expand(this._v3.positionScreen, this._v1.positionScreen, material.overdraw);

                    }

                    this._elemBox.setFromPoints([
                        this._v1.positionScreen,
                        this._v2.positionScreen,
                        this._v3.positionScreen
                    ]);

                    if (this._clipBox.isIntersectionBox(this._elemBox) === true) {

                        this.renderFace3(this._v1, this._v2, this._v3, 0, 1, 2, element, material);

                    }

                }

                /* DEBUG
                setLineWidth( 1 );
                setStrokeStyle( 'rgba( 0, 255, 0, 0.5 )' );
                _context.strokeRect( _elemBox.min.x, _elemBox.min.y, _elemBox.max.x - _elemBox.min.x, _elemBox.max.y - _elemBox.min.y );
                */

                this._clearBox.union(this._elemBox);

            }

            /* DEBUG
            setLineWidth( 1 );
            setStrokeStyle( 'rgba( 255, 0, 0, 0.5 )' );
            _context.strokeRect( _clearBox.min.x, _clearBox.min.y, _clearBox.max.x - _clearBox.min.x, _clearBox.max.y - _clearBox.min.y );
            */

            this._context.setTransform(1, 0, 0, 1, 0, 0);

        }
        
        //

        calculateLights() {

            this._ambientLight.setRGB(0, 0, 0);
            this._directionalLights.setRGB(0, 0, 0);
            this._pointLights.setRGB(0, 0, 0);

            for (var l = 0, ll = this._lights.length; l < ll; l++) {

                var light = this._lights[l];
                var lightColor = light.color;

                if (light instanceof AmbientLight) {

                    this._ambientLight.add(lightColor);

                } else if (light instanceof DirectionalLight) {

                    // for sprites

                    this._directionalLights.add(lightColor);

                } else if (light instanceof PointLight) {

                    // for sprites

                    this._pointLights.add(lightColor);

                }

            }

        }

        calculateLight(position, normal, color) {

            for (var l = 0, ll = this._lights.length; l < ll; l++) {

                var light = this._lights[l];

                this._lightColor.copy(light.color);

                if (light instanceof DirectionalLight) {

                    var lightPosition = this._vector3.setFromMatrixPosition(light.matrixWorld).normalize();

                    var amount = normal.dot(lightPosition);

                    if (amount <= 0) continue;

                    amount *= light.intensity;

                    color.add(this._lightColor.multiplyScalar(amount));

                } else if (light instanceof PointLight) {

                    var lightPosition = this._vector3.setFromMatrixPosition(light.matrixWorld);

                    var amount = normal.dot(this._vector3.subVectors(lightPosition, position).normalize());

                    if (amount <= 0) continue;

                    amount *= light.distance == 0 ? 1 : 1 - _Math.min(position.distanceTo(lightPosition) / light.distance, 1);

                    if (amount == 0) continue;

                    amount *= light.intensity;

                    color.add(this._lightColor.multiplyScalar(amount));

                }

            }

        }

        renderSprite(v1, element, material) {

            this.setOpacity(material.opacity);
            this.setBlending(material.blending);

            var scaleX = element.scale.x * this._canvasWidthHalf;
            var scaleY = element.scale.y * this._canvasHeightHalf;

            var dist = 0.5 * _Math.sqrt(scaleX * scaleX + scaleY * scaleY); // allow for rotated sprite
            this._elemBox.min.set(v1.x - dist, v1.y - dist);
            this._elemBox.max.set(v1.x + dist, v1.y + dist);

            if (material instanceof SpriteMaterial) {

                var texture = material.map;

                if (texture !== null && texture.image !== undefined) {

                    if (texture.hasEventListener('update', this.onTextureUpdate) === false) {

                        if (texture.image.width > 0) {

                            this.textureToPattern(texture);

                        }

                        texture.addEventListener('update', this.onTextureUpdate);

                    }

                    var pattern = this._patterns[texture.id];

                    if (pattern !== undefined) {

                        this.setFillStyle(pattern);

                    } else {

                        this.setFillStyle('rgba( 0, 0, 0, 1 )');

                    }

                    //

                    var bitmap = texture.image;

                    var ox = bitmap.width * texture.offset.x;
                    var oy = bitmap.height * texture.offset.y;

                    var sx = bitmap.width * texture.repeat.x;
                    var sy = bitmap.height * texture.repeat.y;

                    var cx = scaleX / sx;
                    var cy = scaleY / sy;

                    this._context.save();
                    this._context.translate(v1.x, v1.y);
                    if (material.rotation !== 0) this._context.rotate(material.rotation);
                    this._context.translate(- scaleX / 2, - scaleY / 2);
                    this._context.scale(cx, cy);
                    this._context.translate(- ox, - oy);
                    this._context.fillRect(ox, oy, sx, sy);
                    this._context.restore();

                } else {

                    // no texture

                    this.setFillStyle(material.color.getStyle());

                    this._context.save();
                    this._context.translate(v1.x, v1.y);
                    if (material.rotation !== 0) this._context.rotate(material.rotation);
                    this._context.scale(scaleX, - scaleY);
                    this._context.fillRect(- 0.5, - 0.5, 1, 1);
                    this._context.restore();

                }

            } else if (material instanceof SpriteCanvasMaterial) {

                this.setStrokeStyle(material.color.getStyle());
                this.setFillStyle(material.color.getStyle());

                this._context.save();
                this._context.translate(v1.x, v1.y);
                if (material.rotation !== 0) this._context.rotate(material.rotation);
                this._context.scale(scaleX, scaleY);

                material.program(this._context);

                this._context.restore();

            }

            /* DEBUG
            setStrokeStyle( 'rgb(255,255,0)' );
            _context.beginPath();
            _context.moveTo( v1.x - 10, v1.y );
            _context.lineTo( v1.x + 10, v1.y );
            _context.moveTo( v1.x, v1.y - 10 );
            _context.lineTo( v1.x, v1.y + 10 );
            _context.stroke();
            */

        }

        renderLine(v1, v2, element, material) {

            this.setOpacity(material.opacity);
            this.setBlending(material.blending);

            this._context.beginPath();
            this._context.moveTo(v1.positionScreen.x, v1.positionScreen.y);
            this._context.lineTo(v2.positionScreen.x, v2.positionScreen.y);

            if (material instanceof LineBasicMaterial) {

                this.setLineWidth(material.linewidth);
                this.setLineCap(material.linecap);
                this.setLineJoin(material.linejoin);

                if (material.vertexColors !== VertexColors) {

                    this.setStrokeStyle(material.color.getStyle());

                } else {

                    var colorStyle1 = element.vertexColors[0].getStyle();
                    var colorStyle2 = element.vertexColors[1].getStyle();

                    if (colorStyle1 === colorStyle2) {

                        this.setStrokeStyle(colorStyle1);

                    } else {

                        try {

                            var grad = this._context.createLinearGradient(
                                v1.positionScreen.x,
                                v1.positionScreen.y,
                                v2.positionScreen.x,
                                v2.positionScreen.y
                                );
                            grad.addColorStop(0, colorStyle1);
                            grad.addColorStop(1, colorStyle2);

                        } catch (exception) {

                            grad = colorStyle1;

                        }

                        this.setStrokeStyle(grad);

                    }

                }

                this._context.stroke();
                this._elemBox.expandByScalar(material.linewidth * 2);

            } else if (material instanceof LineDashedMaterial) {

                this.setLineWidth(material.linewidth);
                this.setLineCap(material.linecap);
                this.setLineJoin(material.linejoin);
                this.setStrokeStyle(material.color.getStyle());
                this.setLineDash([material.dashSize, material.gapSize]);

                this._context.stroke();

                this._elemBox.expandByScalar(material.linewidth * 2);

                this.setLineDash([]);

            }

        }

        renderFace3(v1, v2, v3, uv1, uv2, uv3, element, material) {

            this.info.render.vertices += 3;
            this.info.render.faces++;

            this.setOpacity(material.opacity);
            this.setBlending(material.blending);

            this._v1x = v1.positionScreen.x; this._v1y = v1.positionScreen.y;
            this._v2x = v2.positionScreen.x; this._v2y = v2.positionScreen.y;
            this._v3x = v3.positionScreen.x; this._v3y = v3.positionScreen.y;

            this.drawTriangle(this._v1x, this._v1y, this._v2x, this._v2y, this._v3x, this._v3y);

            if ((material instanceof MeshLambertMaterial || material instanceof MeshPhongMaterial) && material.map === null) {

                this._diffuseColor.copy(material.color);
                this._emissiveColor.copy(material.emissive);

                if (material.vertexColors === FaceColors) {

                    this._diffuseColor.multiply(element.color);

                }

                this._color.copy(this._ambientLight);

                this._centroid.copy(v1.positionWorld).add(v2.positionWorld).add(v3.positionWorld).divideScalar(3);

                this.calculateLight(this._centroid, element.normalModel, this._color);

                this._color.multiply(this._diffuseColor).add(this._emissiveColor);

                material.wireframe === true
                    ? this.strokePath(this._color, material.wireframeLinewidth, material.wireframeLinecap, material.wireframeLinejoin)
                    : this.fillPath(this._color);

            } else if (material instanceof MeshBasicMaterial ||
                material instanceof MeshLambertMaterial ||
                material instanceof MeshPhongMaterial) {

                if (material.map !== null) {

                    var mapping = material.map.mapping;

                    if (mapping === UVMapping) {

                        this._uvs = element.uvs;
                        this.patternPath(this._v1x, this._v1y, this._v2x, this._v2y, this._v3x, this._v3y, this._uvs[uv1].x, this._uvs[uv1].y, this._uvs[uv2].x, this._uvs[uv2].y, this._uvs[uv3].x, this._uvs[uv3].y, material.map);

                    }

                } else if (material.envMap !== null) {

                    if (material.envMap.mapping === SphericalReflectionMapping) {

                        this._normal.copy(element.vertexNormalsModel[uv1]).applyMatrix3(this._normalViewMatrix);
                        this._uv1x = 0.5 * this._normal.x + 0.5;
                        this._uv1y = 0.5 * this._normal.y + 0.5;

                        this._normal.copy(element.vertexNormalsModel[uv2]).applyMatrix3(this._normalViewMatrix);
                        this._uv2x = 0.5 * this._normal.x + 0.5;
                        this._uv2y = 0.5 * this._normal.y + 0.5;

                        this._normal.copy(element.vertexNormalsModel[uv3]).applyMatrix3(this._normalViewMatrix);
                        this._uv3x = 0.5 * this._normal.x + 0.5;
                        this._uv3y = 0.5 * this._normal.y + 0.5;

                        this.patternPath(this._v1x, this._v1y, this._v2x, this._v2y, this._v3x, this._v3y, this._uv1x, this._uv1y, this._uv2x, this._uv2y, this._uv3x, this._uv3y, material.envMap);

                    }

                } else {

                    this._color.copy(material.color);

                    if (material.vertexColors === FaceColors) {

                        this._color.multiply(element.color);

                    }

                    material.wireframe === true
                        ? this.strokePath(this._color, material.wireframeLinewidth, material.wireframeLinecap, material.wireframeLinejoin)
                        : this.fillPath(this._color);

                }

            } else if (material instanceof MeshDepthMaterial) {

                this._color.r = this._color.g = this._color.b = 1 - Math.smoothstep(v1.positionScreen.z * v1.positionScreen.w, this._camera.near, this._camera.far);

                material.wireframe === true
                    ? this.strokePath(this._color, material.wireframeLinewidth, material.wireframeLinecap, material.wireframeLinejoin)
                    : this.fillPath(this._color);

            } else if (material instanceof MeshNormalMaterial) {

                this._normal.copy(element.normalModel).applyMatrix3(this._normalViewMatrix);

                this._color.setRGB(this._normal.x, this._normal.y, this._normal.z).multiplyScalar(0.5).addScalar(0.5);

                material.wireframe === true
                    ? this.strokePath(this._color, material.wireframeLinewidth, material.wireframeLinecap, material.wireframeLinejoin)
                    : this.fillPath(this._color);

            } else {

                this._color.setRGB(1, 1, 1);

                material.wireframe === true
                    ? this.strokePath(this._color, material.wireframeLinewidth, material.wireframeLinecap, material.wireframeLinejoin)
                    : this.fillPath(this._color);

            }

        }

        //

        drawTriangle(x0, y0, x1, y1, x2, y2) {

            this._context.beginPath();
            this._context.moveTo(x0, y0);
            this._context.lineTo(x1, y1);
            this._context.lineTo(x2, y2);
            this._context.closePath();

        }

        strokePath(color, linewidth, linecap, linejoin) {

            this.setLineWidth(linewidth);
            this.setLineCap(linecap);
            this.setLineJoin(linejoin);
            this.setStrokeStyle(color.getStyle());

            this._context.stroke();

            this._elemBox.expandByScalar(linewidth * 2);

        }

        fillPath(color) {

            this.setFillStyle(color.getStyle());
            this._context.fill();

        }

        onTextureUpdate(event) {

            this.textureToPattern(event.target);

        }

        textureToPattern(texture) {

            if (texture instanceof CompressedTexture) return;

            var repeatX = texture.wrapS === RepeatWrapping;
            var repeatY = texture.wrapT === RepeatWrapping;

            var image = texture.image;

            var canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;

            var context = canvas.getContext('2d');
            context.setTransform(1, 0, 0, - 1, 0, image.height);
            context.drawImage(image, 0, 0);

            this._patterns[texture.id] = this._context.createPattern(
                canvas, repeatX === true && repeatY === true
                    ? 'repeat'
                    : repeatX === true && repeatY === false
                        ? 'repeat-x'
                        : repeatX === false && repeatY === true
                            ? 'repeat-y'
                            : 'no-repeat'
                );

        }

        patternPath(x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2, texture) {

            if (texture instanceof DataTexture) return;

            if (texture.hasEventListener('update', this.onTextureUpdate) === false) {

                if (texture.image !== undefined && texture.image.width > 0) {

                    this.textureToPattern(texture);

                }

                texture.addEventListener('update', this.onTextureUpdate);

            }

            var pattern = this._patterns[texture.id];

            if (pattern !== undefined) {

                this.setFillStyle(pattern);

            } else {

                this.setFillStyle('rgba(0,0,0,1)');
                this._context.fill();

                return;

            }

            // http://extremelysatisfactorytotalitarianism.com/blog/?p=2120

            var a, b, c, d, e, f, det, idet,
                offsetX = texture.offset.x / texture.repeat.x,
                offsetY = texture.offset.y / texture.repeat.y,
                width = texture.image.width * texture.repeat.x,
                height = texture.image.height * texture.repeat.y;

            u0 = (u0 + offsetX) * width;
            v0 = (v0 + offsetY) * height;

            u1 = (u1 + offsetX) * width;
            v1 = (v1 + offsetY) * height;

            u2 = (u2 + offsetX) * width;
            v2 = (v2 + offsetY) * height;

            x1 -= x0; y1 -= y0;
            x2 -= x0; y2 -= y0;

            u1 -= u0; v1 -= v0;
            u2 -= u0; v2 -= v0;

            det = u1 * v2 - u2 * v1;

            if (det === 0) return;

            idet = 1 / det;

            a = (v2 * x1 - v1 * x2) * idet;
            b = (v2 * y1 - v1 * y2) * idet;
            c = (u1 * x2 - u2 * x1) * idet;
            d = (u1 * y2 - u2 * y1) * idet;

            e = x0 - a * u0 - c * v0;
            f = y0 - b * u0 - d * v0;

            this._context.save();
            this._context.transform(a, b, c, d, e, f);
            this._context.fill();
            this._context.restore();

        }

        clipImage(x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2, image) {

            // http://extremelysatisfactorytotalitarianism.com/blog/?p=2120

            var a, b, c, d, e, f, det, idet,
                width = image.width - 1,
                height = image.height - 1;

            u0 *= width; v0 *= height;
            u1 *= width; v1 *= height;
            u2 *= width; v2 *= height;

            x1 -= x0; y1 -= y0;
            x2 -= x0; y2 -= y0;

            u1 -= u0; v1 -= v0;
            u2 -= u0; v2 -= v0;

            det = u1 * v2 - u2 * v1;

            idet = 1 / det;

            a = (v2 * x1 - v1 * x2) * idet;
            b = (v2 * y1 - v1 * y2) * idet;
            c = (u1 * x2 - u2 * x1) * idet;
            d = (u1 * y2 - u2 * y1) * idet;

            e = x0 - a * u0 - c * v0;
            f = y0 - b * u0 - d * v0;

            this._context.save();
            this._context.transform(a, b, c, d, e, f);
            this._context.clip();
            this._context.drawImage(image, 0, 0);
            this._context.restore();

        }

        // Hide anti-alias gaps

        expand(v1, v2, pixels) {

            var x = v2.x - v1.x, y = v2.y - v1.y,
                det = x * x + y * y, idet;

            if (det === 0) return;

            idet = pixels / _Math.sqrt(det);

            x *= idet; y *= idet;

            v2.x += x; v2.y += y;
            v1.x -= x; v1.y -= y;

        }

        // Context cached methods.

        setOpacity(value) {

            if (this._contextGlobalAlpha !== value) {

                this._context.globalAlpha = value;
                this._contextGlobalAlpha = value;

            }

        }

        setBlending(value) {

            if (this._contextGlobalCompositeOperation !== value) {

                if (value === NormalBlending) {

                    this._context.globalCompositeOperation = 'source-over';

                } else if (value === AdditiveBlending) {

                    this._context.globalCompositeOperation = 'lighter';

                } else if (value === SubtractiveBlending) {

                    this._context.globalCompositeOperation = 'darker';

                }

                this._contextGlobalCompositeOperation = value;

            }

        }

        setLineWidth(value) {

            if (this._contextLineWidth !== value) {

                this._context.lineWidth = value;
                this._contextLineWidth = value;

            }

        }

        setLineCap(value) {

            // "butt", "round", "square"

            if (this._contextLineCap !== value) {

                this._context.lineCap = value;
                this._contextLineCap = value;

            }

        }

        setLineJoin(value) {

            // "round", "bevel", "miter"

            if (this._contextLineJoin !== value) {

                this._context.lineJoin = value;
                this._contextLineJoin = value;

            }

        }

        setStrokeStyle(value) {

            if (this._contextStrokeStyle !== value) {

                this._context.strokeStyle = value;
                this._contextStrokeStyle = value;

            }

        }

        setFillStyle(value) {

            if (this._contextFillStyle !== value) {

                this._context.fillStyle = value;
                this._contextFillStyle = value;

            }

        }

        setLineDash(value) {

            if (this._contextLineDash.length !== value.length) {

                this._context.setLineDash(value);
                this._contextLineDash = value;

            }

        }

    }
}