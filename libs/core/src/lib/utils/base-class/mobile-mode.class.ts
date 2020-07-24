import { Directive, ElementRef, InjectionToken, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { DialogConfig } from '../../dialog/dialog-utils/dialog-config.class';
import { DialogRef } from '../../dialog/dialog-utils/dialog-ref.class';
import { DialogService } from '../../dialog/dialog-service/dialog.service';
import { MobileModeConfig } from '../../utils/interfaces/mobile-mode-config';
import { MobileMode } from '../interfaces/mobile-control.interface';
import { Subject } from 'rxjs';
import { MOBILE_CONFIG_ERROR } from '../consts';

export const MOBILE_MODE_CONFIG = new InjectionToken<MobileModeConfigToken>('Provides configuration for mobile control');

export interface MobileModeConfigToken {
    target: MobileModeControl,
    config: MobileModeConfig;
}

export enum MobileModeControl {
    MENU = 'MENU',
    SELECT = 'SELECT',
    COMBOBOX = 'COMBOBOX',
    MULTI_INPUT = 'MULTI_INPUT'
}

@Directive()
export abstract class MobileModeBase<T> implements OnDestroy {
    /** @hidden */
    @ViewChild('dialogTemplate') dialogTemplate: TemplateRef<any>;

    /** @hidden */
    dialogRef: DialogRef;

    /** @hidden */
    dialogConfig: DialogConfig;

    /** @hidden */
    mobileConfig: MobileModeConfig;

    /** @hidden */
    protected readonly _onDestroy$: Subject<void> = new Subject<void>();

    constructor(
        protected _elementRef: ElementRef,
        protected _dialogService: DialogService,
        protected _component: MobileMode & T,
        protected readonly target: MobileModeControl,
        private readonly _mobileModes: MobileModeConfigToken[]) {

        this._mobileModes = this._mobileModes || [];
        this.mobileConfig = this._getMobileModeConfig();
        this.dialogConfig = this.mobileConfig.dialogConfig;
    }

    /** @hidden */
    ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
    }

    /** @hidden */
    private _getMobileModeConfig(): MobileModeConfig {
        const injectedConfig = this._mobileModes.find(mode => mode.target === this.target);

        if (injectedConfig || this._component.mobileConfig) {
            return injectedConfig
                ? this._mergeConfigs(injectedConfig.config || {}, this._component.mobileConfig || {})
                : this._component.mobileConfig;
        } else {
            throw new Error(MOBILE_CONFIG_ERROR);
        }
    }

    /** @hidden New mobile mode config as a merge of config1 and config2. */
    private _mergeConfigs(config1: MobileModeConfig, config2: MobileModeConfig): MobileModeConfig {
        return {
            ...config1,
            ...config2,
            dialogConfig: {
                ...(config1.dialogConfig && config1.dialogConfig),
                ...(config2.dialogConfig && config2.dialogConfig)
            }
        };
    }
}
