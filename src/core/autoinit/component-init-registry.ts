import { COMPONENT_NAMES, COMPONENT_CONFIG } from '../../config';
import { Alert } from '../../components/Alert';
import { Autocomplete } from '../../components/Autocomplete';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { Breadcrumb } from '../../components/Breadcrumb';
import { Bubble } from '../../components/Bubble';
import { Button } from '../../components/Button';
import { ButtonIcon } from '../../components/ButtonIcon';
import { ButtonShape } from '../../components/ButtonShape';
import { ButtonArrow } from '../../components/ButtonArrow';
import { ButtonPad } from '../../components/ButtonPad';
import { ButtonGrid } from '../../components/ButtonGrid';
import { ButtonSmart } from '../../components/ButtonSmart';
import { ButtonGroups } from '../../components/ButtonGroups';
import { ButtonSplit } from '../../components/ButtonSplit';
import { ButtonSegmented } from '../../components/ButtonSegmented';
import { ButtonFabMenu } from '../../components/ButtonFabMenu';
import { ButtonFabDial } from '../../components/ButtonFabDial';
import { ButtonFabRail } from '../../components/ButtonFabRail';
import { ButtonFab } from '../../components/ButtonFab';
import { Counter } from '../../components/Counter';
import { Countdown } from '../../components/Countdown';
import { Card } from '../../components/Card';
import { Checkbox } from '../../components/Checkbox';
import { Chip } from '../../components/Chip';
import { Collapse } from '../../components/Collapse';
import { PanelContent } from '../../components/PanelContent';
import { PanelSplit } from '../../components/PanelSplit';
import { Dialog } from '../../components/Dialog';
import { MessageBox } from '../../components/MessageBox';
import { Drawer } from '../../components/Drawer';
import { Divider } from '../../components/Divider';
import { Stack } from '../../components/Stack';
import { Field } from '../../components/Field';
import { Fieldset } from '../../components/Fieldset';
import { Hero } from '../../components/Hero';
import { Menu } from '../../components/Menu';
import { MenuContext } from '../../components/MenuContext';
import { Pagination } from '../../components/Pagination';
import { PaginationAlpha } from '../../components/PaginationAlpha';
import { PaginationNav } from '../../components/PaginationNav';
import { Pin } from '../../components/Pin';
import { Pricing } from '../../components/Pricing';
import { ProgressIndicator } from '../../components/ProgressIndicator';
import { Quote } from '../../components/Quote';
import { Radio } from '../../components/Radio';
import { Tile } from '../../components/Tile';
import { ScrollSpy } from '../../components/ScrollSpy';
import { IndexList } from '../../components/IndexList';
import { ScrollToTop } from '../../components/ScrollToTop';
import { Select } from '../../components/Select';
import { Shape } from '../../components/Shape';
import { Skeleton } from '../../components/Skeleton';
import { ShuffleNumber } from '../../components/ShuffleNumber';
import { Sheet } from '../../components/Sheet';
import { Slider } from '../../components/Slider';
import { Toast } from '../../components/Toast';
import { Snackbar } from '../../components/Snackbar';
import { Switch } from '../../components/Switch';
import { Tabs } from '../../components/Tabs';
import { NavigationBar } from '../../components/NavigationBar';
import { NavigationRail } from '../../components/NavigationRail';
import { NavigationMenu } from '../../components/NavigationMenu';
import { Textarea } from '../../components/Textarea';
import { Ticker } from '../../components/Ticker';
import { Todo } from '../../components/Todo';
import { Toolbar } from '../../components/Toolbar';
import { Tooltips } from '../../components/Tooltips';
import { List } from '../../components/List';
import { ListMaker } from '../../components/ListMaker';
import { Gauge } from '../../components/Gauge';
import { AppBar } from '../../components/AppBar';
import { IsoFilter } from '../../components/IsoFilter';
import { MediaStories } from '../../components/MediaStories';
import { WheelPicker } from '../../components/WheelPicker';
import { Loader } from '../../components/Loader';
import { toComponentInitFn, type ComponentInitFn } from './component-init-helper';

/** Map nom composant → initFn (composants non différés ; les différés sont chargés via deferred-component-loaders). */
const INIT_FN_BY_NAME: Record<string, ComponentInitFn> = {
    Loader: toComponentInitFn(Loader),
    Alert: toComponentInitFn(Alert),
    Autocomplete: toComponentInitFn(Autocomplete),
    Avatar: toComponentInitFn(Avatar),
    Badge: toComponentInitFn(Badge),
    Breadcrumb: toComponentInitFn(Breadcrumb),
    Bubble: toComponentInitFn(Bubble),
    Button: toComponentInitFn(Button),
    ButtonIcon: toComponentInitFn(ButtonIcon),
    ButtonShape: toComponentInitFn(ButtonShape),
    ButtonArrow: toComponentInitFn(ButtonArrow),
    ButtonPad: toComponentInitFn(ButtonPad),
    ButtonGrid: toComponentInitFn(ButtonGrid),
    ButtonSmart: toComponentInitFn(ButtonSmart),
    ButtonGroups: toComponentInitFn(ButtonGroups),
    ButtonSplit: toComponentInitFn(ButtonSplit),
    ButtonSegmented: toComponentInitFn(ButtonSegmented),
    ButtonFabMenu: toComponentInitFn(ButtonFabMenu),
    ButtonFabDial: toComponentInitFn(ButtonFabDial),
    ButtonFabRail: toComponentInitFn(ButtonFabRail),
    ButtonFab: toComponentInitFn(ButtonFab),
    Counter: toComponentInitFn(Counter),
    Countdown: toComponentInitFn(Countdown),
    Card: toComponentInitFn(Card),
    Checkbox: toComponentInitFn(Checkbox),
    Chip: toComponentInitFn(Chip),
    Collapse: toComponentInitFn(Collapse),
    PanelContent: toComponentInitFn(PanelContent),
    PanelSplit: toComponentInitFn(PanelSplit),
    Dialog: toComponentInitFn(Dialog),
    MessageBox: toComponentInitFn(MessageBox),
    Drawer: toComponentInitFn(Drawer),
    Divider: toComponentInitFn(Divider),
    Stack: toComponentInitFn(Stack),
    Field: toComponentInitFn(Field),
    Fieldset: toComponentInitFn(Fieldset),
    Hero: toComponentInitFn(Hero),
    Menu: toComponentInitFn(Menu),
    MenuContext: toComponentInitFn(MenuContext),
    Pagination: toComponentInitFn(Pagination),
    PaginationAlpha: toComponentInitFn(PaginationAlpha),
    PaginationNav: toComponentInitFn(PaginationNav),
    Pin: toComponentInitFn(Pin),
    Pricing: toComponentInitFn(Pricing),
    ProgressIndicator: toComponentInitFn(ProgressIndicator),
    Quote: toComponentInitFn(Quote),
    Radio: toComponentInitFn(Radio),
    Tile: toComponentInitFn(Tile),
    ScrollSpy: toComponentInitFn(ScrollSpy),
    IndexList: toComponentInitFn(IndexList),
    ScrollToTop: toComponentInitFn(ScrollToTop),
    Select: toComponentInitFn(Select),
    Shape: toComponentInitFn(Shape),
    Skeleton: toComponentInitFn(Skeleton),
    ShuffleNumber: toComponentInitFn(ShuffleNumber),
    Sheet: toComponentInitFn(Sheet),
    Slider: toComponentInitFn(Slider),
    Toast: toComponentInitFn(Toast),
    Snackbar: toComponentInitFn(Snackbar),
    Switch: toComponentInitFn(Switch),
    Tabs: toComponentInitFn(Tabs),
    NavigationBar: toComponentInitFn(NavigationBar),
    NavigationRail: toComponentInitFn(NavigationRail),
    NavigationMenu: toComponentInitFn(NavigationMenu),
    Textarea: toComponentInitFn(Textarea),
    Ticker: toComponentInitFn(Ticker),
    Todo: toComponentInitFn(Todo),
    Toolbar: toComponentInitFn(Toolbar),
    Tooltips: toComponentInitFn(Tooltips),
    WheelPicker: toComponentInitFn(WheelPicker),
    List: toComponentInitFn(List),
    ListMaker: toComponentInitFn(ListMaker),
    Gauge: toComponentInitFn(Gauge),
    AppBar: toComponentInitFn(AppBar),
    IsoFilter: toComponentInitFn(IsoFilter),
    MediaStories: toComponentInitFn(MediaStories),
};

/** Toutes les entrées (initFn absent pour les composants différés — voir init-components). */
export const COMPONENT_INIT_STRUCTURE = (COMPONENT_NAMES as readonly string[]).map((name) => ({
    name,
    initFn: INIT_FN_BY_NAME[name],
    ...COMPONENT_CONFIG[name as keyof typeof COMPONENT_CONFIG],
}));
