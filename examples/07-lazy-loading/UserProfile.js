import { Component, html } from '@supercat1337/ui';

export class UserProfile extends Component {
    // Component layout defined as an ESM constant
    layout = html`
        <div class="profile-card">
            <img src="https://i.pravatar.cc/150" alt="Avatar" />
            <div class="info">
                <h3>John Doe</h3>
                <p>Full-stack Developer</p>
            </div>
        </div>
    `;
}
