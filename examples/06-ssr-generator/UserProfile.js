// @ts-check
import { Component, html } from '../../dist/ui.bundle.esm.js';

export class UserProfile extends Component {
    /**
     * @param {{id:number; name:string; role:string}} data
     */
    constructor(data) {
        // We pass instanceId so it's consistent across environments
        super({ instanceId: `user-${data.id}` });
        this.data = data;
    }

    // This layout is used both by SSR string generator and Client mounting
    layout = () => html`
        <div class="card shadow-sm" style="width: 18rem;">
            <div class="card-body text-center">
                <h5 class="card-title" data-ref="userName">${this.data.name}</h5>
                <p class="text-muted" data-ref="userRole">${this.data.role}</p>
                <button class="btn btn-outline-primary w-100" data-ref="followBtn">Follow</button>
            </div>
        </div>
    `;

    refsAnnotation = {
        userName: HTMLHeadingElement.prototype,
        userRole: HTMLParagraphElement.prototype,
        followBtn: HTMLButtonElement.prototype,
    };

    /**
     * @returns {this['refsAnnotation']}
     */
    getRefs() {
        return super.getRefs();
    }

    connectedCallback() {
        if (this.isServer) return;

        const refs = this.getRefs();
        refs.followBtn.onclick = () => {
            refs.followBtn.classList.replace('btn-outline-primary', 'btn-success');
            refs.followBtn.textContent = 'Following';
            console.log(`Now following ${this.data.name}`);
        };
    }
}
