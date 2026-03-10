// @ts-check
import { Component } from '@supercat1337/ui';

class HydratedWidget extends Component {
    refsAnnotation = {
        title: HTMLHeadingElement.prototype,
        status: HTMLSpanElement.prototype,
        actionBtn: HTMLButtonElement.prototype,
    };

    state = {
        userName: 'Guest',
        userStatus: 'Offline',
    };

    /**
     * @param {{userName:string, userStatus:string}} data
     */
    restoreCallback(data) {
        console.log('Restoring state before DOM is ready...');
        this.state.userName = data.userName;
        this.state.userStatus = data.userStatus;
    }

    connectedCallback() {
        console.log('DOM is ready, attaching logic...');
        const refs = this.getRefs();

        refs.title.textContent = this.state.userName;
        refs.status.textContent = this.state.userStatus;
        refs.status.className = 'badge bg-success';

        refs.actionBtn.onclick = () => {
            alert(`Hello, ${this.state.userName}!`);
        };
    }
}

const container = document.getElementById('ssr-widget');

if (container) {
    const widget = new HydratedWidget({ instanceId: 'user-profile', sid: 'root.profile' });
    widget.mount(container, 'hydrate');
}
