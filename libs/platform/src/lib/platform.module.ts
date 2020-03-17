import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FundamentalNgxCoreModule } from '@fundamental-ngx/core';
import { PlatformButtonModule } from './components/button/button.module';
import { PlatformSearchFieldModule } from './components/search-field/search-field.module';
import { ActionBarModule } from './components/action-bar/action-bar.module';
import { PlatformMenuModule } from './components/menu/menu.module';
import { PlatformSelectModule } from './components/select/select.module';
import { PlatformLinkModule } from './components/link/link.module';
import { FdpComboBoxModule } from './components/form/public_api';

@NgModule({
    imports: [CommonModule, FundamentalNgxCoreModule],
    exports: [
        PlatformButtonModule,
        PlatformSearchFieldModule,
        ActionBarModule,
        PlatformMenuModule,
        PlatformSelectModule,
        PlatformLinkModule,
        FdpComboBoxModule
    ]
})
export class FundamentalNgxPlatformModule { }
