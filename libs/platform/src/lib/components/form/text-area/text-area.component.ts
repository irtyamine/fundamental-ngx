import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Input,
    Optional,
    Self,
    ViewChild,
    ViewEncapsulation,
    HostListener,
    AfterViewChecked
} from '@angular/core';
import { NgControl, NgForm } from '@angular/forms';
import { BaseInput } from '../base.input';
import { FormFieldControl, Status } from '../form-control';
import { DELETE, BACKSPACE } from '@angular/cdk/keycodes';

const VALID_WRAP_TYPES = ['hard', 'soft', 'off'];

export type WrapType = 'hard' | 'soft' | 'off';

/**
 * Textarea field implementation that is compliant with Platform's FormGroup/FormField design
 *
 */
@Component({
    selector: 'fdp-textarea',
    templateUrl: 'text-area.component.html',
    styleUrls: ['text-area.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: FormFieldControl,
            useExisting: TextAreaComponent,
            multi: true
        }
    ]
})
export class TextAreaComponent extends BaseInput implements AfterViewChecked {
    /**
     * The height to which the textarea will grow when `growing` is set.
     */
    @Input()
    height: string;

    /**
     * The number of rows that will be visible when `growing` is set.
     * If both `growingMaxLines` and `height` are provided, `height` value takes precedence.
     */
    @Input()
    growingMaxLines: number;

    /**
     * The textarea `cols` attribute wrapped- the number of letters visible per line.
     * If width is set to auto, this attribute has no effect.
     */
    @Input()
    cols: number;

    /**
     * The textarea `wrap` attribute - can be one of three: 'off', 'hard' or 'soft'.
     */
    @Input()
    wrapType: WrapType = 'soft';

    /**
     * Whether the textarea is readonly
     */
    @Input()
    readonly: boolean;

    /** The maximum number of characters allowed to enter.
     * If `showExceededText` is false, `maxLength` has native textarea's behavior of disallowing typing beyond `maxLength`.
     * If `showExceededText` is true, user is allowed to type beyond `maxLength`, but error states and counter messages showing
     * the exceeded count is displayed.
     */
    @Input()
    maxLength: number;

    /**
     * Whether counter message should be shown.
     * If `showExceededText` is false, no state changes or error messages are shown. User is simply not allowed to type
     * beyond the `maxLength` characters.
     */
    @Input()
    showExceededText: boolean = false;

    /**
     * Whether this textarea can grow.
     */
    @Input()
    growing: boolean = false;

    /**
     *  The state of the form control - applies css classes when counter exceeds the `maxLength`.
     *  Can be `error` or `warning`.
     */
    @Input()
    stateType: Status = 'warning';

    /**
     * return: The textarea's value
     */
    @Input() get value(): any {
        return super.getValue();
    }

    /**
     * set the textarea value
     */
    set value(value: any) {
        if (value) {
            super.setValue(value);
        } else {
            // when custom value not set, we should set/reset counter to maxlength value when it becomes undefined
            this.exceededCharCount = this.maxLength ? this.maxLength : 0;
            // reset state by resetting value
            super.writeValue('');
        }
    }

    /** @hidden */
    @ViewChild('textareaElement')
    textareaElement: ElementRef;

    /** @hidden */
    hasTextExceeded: boolean = false;

    /** @hidden excess character count */
    exceededCharCount: number = this.maxLength ? this.maxLength : 0;

    /** @hidden a string placeholder that toggles between 'remaining' and 'excess' for the select ICU expression */
    counterExcessOrRemaining = 'remaining';

    /** @hidden flag to check if there is an initial value set */
    isValueCustomSet = false;

    /** @hidden */
    /** to keep track of number of characters in the textarea */
    private _textAreaCharCount: number = 0;

    /** @hidden */
    private _isPasted: boolean = false;

    /** for i18n counter message translation */
    private readonly remainingText = 'remaining';
    private readonly excessText = 'excess';

    constructor(
        protected _cd: ChangeDetectorRef,
        @Optional() @Self() public ngControl: NgControl,
        @Optional() @Self() public ngForm: NgForm
    ) {
        super(_cd, ngControl, ngForm);
        if (this.ngControl) {
            this.ngControl.valueAccessor = this;
        }
    }

    /** @hidden */
    ngOnInit(): void {
        if (!this.wrapType || VALID_WRAP_TYPES.indexOf(this.wrapType) === -1) {
            throw new Error(`Textarea wrap type $ {this.wrapType} is not supported`);
        }
        // if not custom set, set counter to max length value, else it calculates remaining/exceeded characters.
        if (!this.value) {
            this.exceededCharCount = this.maxLength ? this.maxLength : 0;
        } else {
            this.isValueCustomSet = true;
        }
        super.ngOnInit();
    }

    /** @hidden */
    ngAfterViewInit(): void {
        // set max height
        this._setMaxHeight();

        // don't set any error state if we are not showing counter message
        if (!this.showExceededText) {
            this.stateType = null;
        }

        super.ngAfterViewInit();
    }

    /** @hidden */
    ngAfterViewChecked() {
        // when value is custom set(initial value is present), the heights don't get
        // set to show the full text in the ngAfterViewInit immediately. therefore, we call autoGrowTextArea in
        // ngAfterViewChecked and detect changes again.
        if (this.value && this.isValueCustomSet) {
            this.autoGrowTextArea(); // if applicable, grow the textarea when value is custom set
            this.stateChanges.next('textarea: ngAfterViewChecked');
        }
    }

    /** write value for ControlValueAccessor */
    writeValue(value: any): void {
        if (value) {
            super.writeValue(value);
            this.updateCounterInteractions();
            this.stateChanges.next('textarea: writeValue');
        }
    }

    /** update the counter message and related interactions */
    updateCounterInteractions(): void {
        if (this.value) {
            this._textAreaCharCount = this.value.length;
            if (this.maxLength) {
                // newly added to avoid unnecessary iteration, remove if issue found
                this.validateLengthOnCustomSet();
            }
        }
    }

    /** if exceeded maxlength when set as a value in code, highlight the exceeded text. */
    validateLengthOnCustomSet(): void {
        if (this._textAreaCharCount > this.maxLength) {
            if (this._isPasted) {
                this.textareaElement.nativeElement.focus();
                // this.textareaElement.nativeElement.setSelectionRange(10, 20);
                this.textareaElement.nativeElement.setSelectionRange(this.maxLength, this._textAreaCharCount);
            }
            this.counterExcessOrRemaining = this.excessText;
            this.exceededCharCount = this._textAreaCharCount - this.maxLength;
        } else {
            this.counterExcessOrRemaining = this.remainingText;
            this.exceededCharCount = this.maxLength - this._textAreaCharCount;
        }
        // reset flag
        this._isPasted = false;
    }

    /** handle exceeded maxlength case when text is pasted */
    handlePasteInteraction(): void {
        this._isPasted = true;
        /// For IE
        if (window['clipboardData']) {
            const value = window['clipboardData'].getData('Text');
            // todo: handle for IE
            this.updateCounterInteractions();
        } else {
            // for other navigators
            navigator['clipboard'].readText().then((clipText) => {
                this.updateCounterInteractions();
            });
        }
    }

    /** handle auto growing of textarea */
    autoGrowTextArea() {
        if (this.growing) {
            this.textareaElement.nativeElement.style.height = 'inherit';
            const textareaTotalHeight = this._getTextareaTotalHeight();
            const maxHeight = parseInt(this.textareaElement.nativeElement.style.maxHeight as string, 10);
            if (maxHeight) {
                if (textareaTotalHeight <= maxHeight) {
                    this.textareaElement.nativeElement.style.height = textareaTotalHeight + 'px';
                } else {
                    if (this.height) {
                        this.textareaElement.nativeElement.style.height = this.height;
                    } else {
                        this.textareaElement.nativeElement.style.height = maxHeight + 'px';
                    }
                }
            } else {
                // no bound max height, keep growing
                this.textareaElement.nativeElement.style.height = textareaTotalHeight + 'px';
            }
        }
    }

    /**
     * get line height of textarea
     */
    getTextareaLineHeight(): number {
        // Get the computed styles for the element
        if (this.textareaElement && this.textareaElement.nativeElement) {
            const computed = window.getComputedStyle(this.textareaElement.nativeElement);

            // Calculate the height
            return parseInt(computed.getPropertyValue('line-height'), 10);
        }
        return 20; // default line height if nothing is defined
    }

    /** when backpress or delete key is pressed when showExceededText field is not set, simply remove excess characters,
    /* else handle autogrow case
    */
    @HostListener('keyup', ['$event'])
    handleBackPress(event: KeyboardEvent) {
        // if not showing exceeded text message/interactions or growing, and custom value set
        if (this.growing) {
            this.autoGrowTextArea();
            this.isValueCustomSet = false; // set it to false first time it comes here
        }
        if (!this.showExceededText && (event.keyCode === DELETE || event.keyCode === BACKSPACE)) {
            // for the custom value set and showExceededText=false case, on any key press, remove excess characters
            if (this.value) {
                this._textAreaCharCount = this.value.length;
                if (this._textAreaCharCount > this.maxLength) {
                    // remove excess characters
                    this.value = this.value.substring(0, this.maxLength);
                    this.isValueCustomSet = false; // since value is now changed, it is no longer custom set
                }
            }
        }
    }

    /**
     * get the updated state when character count breaches `maxLength`
     */
    getUpdatedState(): string {
        if (this._getContentLength() > this.maxLength) {
            this.hasTextExceeded = true; // set flag for error message to also change accordingly
            this.counterExcessOrRemaining = this.excessText;

            return this.stateType as string;
        }
        this.hasTextExceeded = false;
        this.counterExcessOrRemaining = this.remainingText;

        return this.status as string; // return any other errors found by parent form field
    }

    /** @hidden get the length of the textarea content */
    private _getContentLength(): number {
        let contentLength;
        if (this.textareaElement) {
            contentLength = this.textareaElement.nativeElement.value.length;
        }
        if (this.value) {
            contentLength = this.value.length;
        }
        return contentLength;
    }

    /** @hidden get the total height including borders and scroll height */
    private _getTextareaTotalHeight(): number {
        // Get the computed styles for the element
        const computed = window.getComputedStyle(this.textareaElement.nativeElement);
        // Calculate the height
        const height =
            parseInt(computed.getPropertyValue('border-top-width'), 10) +
            this.textareaElement.nativeElement.scrollHeight +
            parseInt(computed.getPropertyValue('border-bottom-width'), 10);

        return height;
    }

    /** @hidden set initial max height **/
    private _setMaxHeight() {
        if (this.growing && this.textareaElement && this.textareaElement.nativeElement) {
            if (this.growingMaxLines) {
                this.textareaElement.nativeElement.style.maxHeight =
                    this.growingMaxLines * this.getTextareaLineHeight() + 'px';
            }
            if (this.height) {
                this.textareaElement.nativeElement.style.maxHeight = this.height;
            }
        } else {
            if (this.growingMaxLines) {
                // nothing to do here. rows attribute takes care.
            }
            if (this.height) {
                this.textareaElement.nativeElement.style.height = this.height;
            }
        }
    }
}
