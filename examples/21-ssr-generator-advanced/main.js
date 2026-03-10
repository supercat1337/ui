// @ts-check
import { ProductComponent } from './ProductComponent.js';
import { CartComponent } from './CartComponent.js';
import { ToastComponent } from './ToastComponent.js';
import { Config } from '@supercat1337/ui';

// Словарь доступных компонентов по имени класса
const componentRegistry = {
    ProductComponent,
    CartComponent,
    ToastComponent,
};

// Получаем манифест из глобальной переменной, созданной renderManifestHTML
const manifest = Config.getManifest();

// Функция гидратации одного компонента
function hydrateFromElement(element) {
    const sid = element.getAttribute('data-sid');
    if (!sid) return;

    const instanceId = element.getAttribute('data-component-root');

    const meta = manifest[sid];
    if (!meta) {
        console.warn(`No manifest entry for sid "${sid}"`);
        return;
    }

    const { className } = meta;
    const ComponentClass = componentRegistry[className];
    if (!ComponentClass) {
        console.warn(`Component class "${className}" not found for instanceId "${instanceId}"`);
        return;
    }

    // Создаём экземпляр с instanceId и sid (если есть)
    const component = new ComponentClass({
        instanceId,
        sid: sid,
    });

    // Монтируем в режиме гидратации
    component.mount(element, 'hydrate');
}

// Обходим все элементы с data-component-root в порядке их появления в DOM
document.querySelectorAll('[data-sid]').forEach(hydrateFromElement);
