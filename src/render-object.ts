import { Engine } from './engine';
import { RenderAttribute, RenderUnit } from './render-unit';
import { ImageTexture } from './texture';
import { IdCreator, arrayEqual, numberClamp } from './utils';
import { ComponentInterface } from './interfaces';
import { SearchableObject } from './searchable-object';

export class RenderObject extends SearchableObject implements ComponentInterface {
	private _id: string;
	private _originUnit: RenderUnit;
	private _borderUnit: RenderUnit;
	private _originId: string;
	private _borderId: string;
	private _isAdded: boolean;
	private _isBorderAdded: boolean;
	private _texture: ImageTexture;
	private _textureHandler: Function;
	private _needReset: boolean = false;

	private _attribs = {
		'translation': [0,0],
		'rotation': 0,
		'scale': 1,
		'backgroundColor': [0,0,0,0],
		'uv': null,
		'vertexOffsetValue': [0,0],
		'isText': false,
		'textBorderWidth': 0,
		'textBorderColor': [0,0,0,0],
		'borderWidth': 0,
		'borderColor': [0,0,0,0],
		'borderDashed': 0,
		'opacity': 1,
	};

	private _attriblist = [
		'vertexOffsetValue',
		'translation',
		'rotation',
		'scale',
		'backgroundColor',
		'uv',

		'borderWidth',
		'borderColor',
		'borderDashed',
		
		'isText',
		'textBorderWidth',
		'textBorderColor',

		'opacity',
	];

	constructor(originUnit: RenderUnit, borderUnit: RenderUnit) {
		super(originUnit.engine.searcher);
		this._originUnit = originUnit;
		this._borderUnit = borderUnit;
		this._id = IdCreator.createId();
		this._textureHandler = t => this.changeUV(t);
	}

	public get id(): string {
		return this._id;
	}

	public get engine(): Engine {
		return this._originUnit.engine;
	}

	public get isShown(): boolean {
		return this._isAdded;
	}

	public show() {
		if(!this._isAdded) {
			this._originId = this._originUnit.add();
			this._isAdded = true;
			this.updateStatus();
			this.searchable && this.registToSearcher();
		}
		if(!this._isBorderAdded && this.borderWidth > 0) {
			this.addBorder();
		}
		return this;
	}

	public hide() {
		this._isAdded && this._originUnit.remove(this._originId);
		this._isBorderAdded && this._borderUnit.remove(this._borderId);
		this._isAdded = false;
		this._isBorderAdded = false;
		this.deregistToSearcher();
		return this;
	}

	public set translation(offset: number[]) {
		this.engine.isDebug && console.log('RenderObject:: translation: ', offset);
		// if(!this._needReset && arrayEqual(offset, this._attribs['translation'])) return;
		this._isAdded && this._originUnit.setAttribute(this._originId, RenderAttribute.TRANSLATION_AND_ROTATION, offset, 0);
		this._isBorderAdded && this._borderUnit.setAttribute(this._borderId, RenderAttribute.TRANSLATION_AND_ROTATION, offset, 0);
		this._attribs['translation'] = offset;
		this.searchable && this.registToSearcher();
	}

	public get translation(): number[] {
		if(this._isAdded) {
			return this._originUnit.getAttribute(this._originId, RenderAttribute.TRANSLATION_AND_ROTATION, 0, 2);
		}
		return this._attribs['translation'];
	}

	public set rotation(radian: number) {
		// if(!this._needReset && this.rotation == radian) return;
		const data = [radian];
		this._isAdded && this._originUnit.setAttribute(this._originId, RenderAttribute.TRANSLATION_AND_ROTATION, data, 2);
		this._isBorderAdded && this._borderUnit.setAttribute(this._borderId, RenderAttribute.TRANSLATION_AND_ROTATION, data, 2);
		this._attribs['rotation'] = radian;
		this.searchable && this.registToSearcher();
	}

	public get rotation(): number {
		if(this._isAdded) {
			return this._originUnit.getAttribute(this._originId, RenderAttribute.TRANSLATION_AND_ROTATION, 2, 1)[0];
		}
		return this._attribs['rotation'];
	}

	public set scale(n: number) {
		// if(!this._needReset && this.scale == n) return;
		const data = [n];
		this._isAdded && this._originUnit.setAttribute(this._originId, RenderAttribute.IS_TEXT_AND_BORDER_WIDTH_AND_DASHED_AND_SCALE, data, 3);
		this._isBorderAdded && this._borderUnit.setAttribute(this._borderId, RenderAttribute.IS_TEXT_AND_BORDER_WIDTH_AND_DASHED_AND_SCALE, data, 3);
		this._attribs['scale'] = n;
		this.searchable && this.registToSearcher();
	}

	public get scale(): number {
		if(this._isAdded) {
			return this._originUnit.getAttribute(this._originId, RenderAttribute.IS_TEXT_AND_BORDER_WIDTH_AND_DASHED_AND_SCALE, 3, 1)[0];
		}
		return this._attribs['scale'];
	}

	public set backgroundColor(color: number[]) {
		// if(!this._needReset && arrayEqual(color, this._attribs['backgroundColor'])) return;
		const data = color.map(c => c/255);
		this._isAdded && this._originUnit.setAttribute(this._originId, RenderAttribute.BACKGROUND_COLOR, data);
		this._attribs['backgroundColor'] = color;
	}

	public get backgroundColor(): number[] {
		if(this._isAdded) {
			return this._originUnit.getAttribute(this._originId, RenderAttribute.BACKGROUND_COLOR, 0, 4).map(c => c * 255);
		}
		return this._attribs['backgroundColor'];
	}

	public set texture(texture: ImageTexture) {
		if(!texture || !(texture instanceof ImageTexture)) {
			if(this._texture && (this._texture instanceof ImageTexture)) {
				this._texture.unbind(this._textureHandler);
				this._texture = null;
			}
			this.changeUV(null);
			return;
		} 
		const t = this._texture;
		const tt = texture as ImageTexture;

		if ( !this._needReset && 
			t instanceof ImageTexture && 
			arrayEqual([t.u,t.v,t.width,t.height], [tt.u,tt.v,tt.width,tt.height])) return;

		(this._texture instanceof ImageTexture) && this._texture.unbind(this._textureHandler);
		
		this._texture = texture;
		this.changeUV(this._texture);
		this._texture.bind(this._textureHandler);
	}

	public set borderWidth(width: number) {
		if(this._isBorderAdded && width == this._attribs.borderWidth) return;
		
		const data = [width];
		if(width > 0 && (!this._isBorderAdded || this.borderWidth <= 0)) {
			this.addBorder();
		}

		if(this._isBorderAdded && width <= 0 && this.borderWidth > 0) {
			this.removeBorder();
			return;
		}

		if(this._isBorderAdded) {
			this._borderUnit.setAttribute(this._borderId, RenderAttribute.VERTEX_AND_EDGE_OFFSET_VALUE, data, 2);
			this.borderColor = this.borderColor;
		}

		this._attribs['borderWidth'] = width;
	}

	public get borderWidth(): number {
		if(this._isBorderAdded) {
			return this._borderUnit.getAttribute(this._borderId, RenderAttribute.VERTEX_AND_EDGE_OFFSET_VALUE, 2, 1)[0];
		}
		return this._attribs['borderWidth'];
	}

	public set borderColor(color: number[]) {
		// if(!this._needReset && arrayEqual(color, this._attribs['borderColor'])) return;
		const data = color.map(c => c/255);
		this._isBorderAdded && this._borderUnit.setAttribute(this._borderId, RenderAttribute.BACKGROUND_COLOR, data);
		this._attribs['borderColor'] = color;
	}

	public get borderColor(): number[] {
		if(this._isBorderAdded) {
			return this._borderUnit.getAttribute(this._borderId, RenderAttribute.BACKGROUND_COLOR, 0, 4).map(c => c * 255);
		}
		return this._attribs['borderColor'];
	}

	public set borderDashed(n: number) {
		// if(!this._needReset && n == this._attribs.borderDashed) return;
		this._isBorderAdded && this._borderUnit.setAttribute(this._borderId, RenderAttribute.IS_TEXT_AND_BORDER_WIDTH_AND_DASHED_AND_SCALE, [n*window.devicePixelRatio], 2);
		this._attribs.borderDashed = n;
	}

	public get borderDashed(): number {
		if(this._isBorderAdded) {
			return this._borderUnit.getAttribute(this._borderId, RenderAttribute.IS_TEXT_AND_BORDER_WIDTH_AND_DASHED_AND_SCALE, 2, 1)[0];
		}
		return this._attribs.borderDashed;
	}

	public set vertexOffsetValue(value: number[]) {
		// if(!this._needReset && arrayEqual(value, this._attribs['vertexOffsetValue'])) return;
		this._isAdded && this._originUnit.setAttribute(this._originId, RenderAttribute.VERTEX_AND_EDGE_OFFSET_VALUE, value);
		this._isBorderAdded && this._borderUnit.setAttribute(this._borderId, RenderAttribute.VERTEX_AND_EDGE_OFFSET_VALUE, value);
		this._attribs['vertexOffsetValue'] = value;
		this.searchable && this.registToSearcher();
	}

	public get vertexOffsetValue(): number[] {
		if(this._isAdded) {
			return this._originUnit.getAttribute(this._originId, RenderAttribute.VERTEX_AND_EDGE_OFFSET_VALUE, 0, 2);
		}
		return this._attribs['vertexOffsetValue'];
	}

	public set size(value: number[]) {
		this.vertexOffsetValue = value;
	}

	public get size(): number[] {
		return this.vertexOffsetValue;
	}

	public set isText(ist: boolean) {
		if(!this._needReset && this._attribs['isText'] == ist) return;
		let r = ist? 1: 0;
		const data = [r];
		this._originUnit.setAttribute(this._originId, RenderAttribute.IS_TEXT_AND_BORDER_WIDTH_AND_DASHED_AND_SCALE, data, 0);
		this._attribs['isText'] = ist;
	}

	public get isText(): boolean {
		if(this._isAdded) {
			return (this._originUnit.getAttribute(this._originId, RenderAttribute.IS_TEXT_AND_BORDER_WIDTH_AND_DASHED_AND_SCALE, 0, 1)[0] == 1);
		}
		return this._attribs['isText'];
	}

	public set textBorderWidth(n: number) {
		// if(!this._needReset && n == this._attribs['textBorderWidth']) return;
		const data = [n];
		this._originUnit.setAttribute(this._originId, RenderAttribute.IS_TEXT_AND_BORDER_WIDTH_AND_DASHED_AND_SCALE, data, 1);
		this._attribs['textBorderWidth'] = n;
	}

	public get textBorderWidth(): number {
		if(this._isAdded) {
			return this._originUnit.getAttribute(this._originId, RenderAttribute.IS_TEXT_AND_BORDER_WIDTH_AND_DASHED_AND_SCALE, 1, 1)[0];
		}
		return this._attribs['textBorderWidth'];
	}

	public set textBorderColor(color: number[]) {
		// if(!this._needReset && arrayEqual(color, this._attribs['textBorderColor'])) return;
		this._originUnit.setAttribute(this._originId, RenderAttribute.TEXT_BORDER_COLOR, color.map(c=>c/255));
		this._attribs['textBorderColor'] = color;
	}

	public get textBorderColor(): number[] {
		return this._attribs['textBorderColor'];
	}

	public set opacity(n: number) {
		let op = numberClamp(0, 1, n);
		this._originUnit.setAttribute(this._originId, RenderAttribute.OPACITY, [op]);
		this._attribs['opacity'] = op;
	}

	public get opacity(): number {
		if(this._isAdded) {
			return this._originUnit.getAttribute(this._originId, RenderAttribute.OPACITY, 0, 1)[0];
		}
		return this._attribs['opacity'];
	}

	public getVertexPositions(expand: number = 0): number[] {
		return this._originUnit.getVertexesPositionById(this._originId, expand);
	}

	private changeUV(texture: ImageTexture) {
		if(!texture || !(texture instanceof ImageTexture)) {
			this._isAdded && this._originUnit.setAttribute(this._originId, RenderAttribute.UV_RECT, [0,0,0,0]);	
		} else {
			const uv = [texture.u, texture.v, texture.width, texture.height];
			this._isAdded && this._originUnit.setAttribute(this._originId, RenderAttribute.UV_RECT, uv);
			this._attribs['uv'] = uv;
		}
	}

	private updateStatus() {
		this._needReset = true;
		const list = this._attriblist;
		const s = this._attribs;
		list.forEach(v => this[v] = s[v]);
		this.changeUV(this._texture);
		this._needReset = false;
	}

	private addBorder() {
		if(!this._isBorderAdded) {
			this._borderId = this._borderUnit.add();

			this._borderUnit.setAttribute(this._borderId, RenderAttribute.TRANSLATION_AND_ROTATION, this.translation, 0);
			this._borderUnit.setAttribute(this._borderId, RenderAttribute.TRANSLATION_AND_ROTATION, [this.rotation], 2);
			this._borderUnit.setAttribute(this._borderId, RenderAttribute.VERTEX_AND_EDGE_OFFSET_VALUE, this.vertexOffsetValue, 0);
			this._borderUnit.setAttribute(this._borderId, RenderAttribute.VERTEX_AND_EDGE_OFFSET_VALUE, [this.borderWidth], 2);
			this._borderUnit.setAttribute(this._borderId, RenderAttribute.BACKGROUND_COLOR, this.borderColor, 0);
			this._borderUnit.setAttribute(this._borderId, RenderAttribute.IS_TEXT_AND_BORDER_WIDTH_AND_DASHED_AND_SCALE, [this.borderDashed], 2);
			this._borderUnit.setAttribute(this._borderId, RenderAttribute.IS_TEXT_AND_BORDER_WIDTH_AND_DASHED_AND_SCALE, [this.scale], 3);
			this._borderUnit.setAttribute(this._borderId, RenderAttribute.OPACITY, [1], 0);

			this._isBorderAdded = true;
		}
	}

	private removeBorder() {
		if(this._isBorderAdded) {
			this._borderUnit.remove(this._borderId);
			this._borderId = undefined;
			this._isBorderAdded = false;
		}
	}
}