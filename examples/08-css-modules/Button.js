// @ts-check
import { Component, html } from '@supercat1337/ui';

// @ts-ignore
import styles from './Button.module.css';

export class StyledButton extends Component {
    /**
     * @param {Object} props
     * @param {string} props.label
     * @param {'primary' | 'secondary'} props.type
     * @param {boolean} [props.isActive]
     */
    constructor(props) {
        super();
        this.props = props;
    }

    // We use the styles object to apply scoped classes
    layout = () => {
        const { label, type, isActive } = this.props;

        // Logic to combine scoped classes
        const classList = [styles.btn, styles[type], isActive ? styles.active : '']
            .join(' ')
            .trim();

        return html` <button class="${classList}" data-ref="button">${label}</button> `;
    };
}
