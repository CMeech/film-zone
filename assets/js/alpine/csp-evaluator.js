import jsep from "jsep";

export function installCspEvaluator(Alpine) {
    Alpine.setEvaluator((expression, context, scope = {}) => {
        try {
            const ast = jsep(expression);
            return evaluateAst(ast, context, scope);
        } catch (err) {
            console.error("CSP Eval error:", expression, err);
            return undefined;
        }
    });

    // Patch evaluateLater + evaluateSync
    Alpine.evaluateLater = (el, expression) => {
        return (callback = () => {}, extras = {}) => {
            let result;
            try {
                result = Alpine.setEvaluator(expression, Alpine.addScopeToNode(el, extras));
            } catch (e) {
                console.error("evaluateLater error:", expression, e);
            }
            callback(result);
        };
    };

    Alpine.evaluateSync = (el, expression, extras = {}) => {
        try {
            return Alpine.setEvaluator(
                expression,
                Alpine.addScopeToNode(el, extras)
            );
        } catch (e) {
            console.error("evaluateSync error:", expression, e);
            return undefined;
        }
    };

    // Inject magics into scope
    Alpine.addScopeToNode = (node, data) => {
        const magics = {
            $el: node,
            $refs: Alpine.$data?.$refs || {},
            $store: Alpine.store,
            $id: (name, el = node) => Alpine.closestId(el, name),
            $dispatch: (event, detail = {}) =>
                node.dispatchEvent(new CustomEvent(event, { detail, bubbles: true })),
            $watch: Alpine.watch,
            $nextTick: Alpine.nextTick,
            $root: Alpine.$data,
            $data: data,
        };
        return { ...data, ...magics };
    };
}

// Extracted from before
function evaluateAst(ast, context, scope) {
    function evaluate(node, localScope) {
        switch (node.type) {
            case "Literal": return node.value;
            case "Identifier":
                if (localScope.hasOwnProperty(node.name)) return localScope[node.name];
                if (context.hasOwnProperty(node.name)) return context[node.name];
                return undefined;
            case "MemberExpression":
                const obj = evaluate(node.object, localScope);
                const prop = node.computed
                    ? evaluate(node.property, localScope)
                    : node.property.name;
                return obj?.[prop];
            case "UnaryExpression":
                return evalUnary(node.operator, evaluate(node.argument, localScope));
            case "BinaryExpression":
            case "LogicalExpression":
                return evalBinary(
                    node.operator,
                    evaluate(node.left, localScope),
                    evaluate(node.right, localScope)
                );
            case "CallExpression":
                const fn = evaluate(node.callee, localScope);
                const args = node.arguments.map(a => evaluate(a, localScope));
                if (typeof fn === "function") return fn.apply(context, args);
                return undefined;
            case "ArrayExpression":
                return node.elements.map(el => evaluate(el, localScope));
            case "ObjectExpression":
                return node.properties.reduce((acc, prop) => {
                    acc[prop.key.name || prop.key.value] = evaluate(prop.value, localScope);
                    return acc;
                }, {});
            default:
                return undefined;
        }
    }
    return evaluate(ast, scope);
}

function evalUnary(op, val) {
    switch (op) {
        case "!": return !val;
        case "+": return +val;
        case "-": return -val;
        default: return undefined;
    }
}

function evalBinary(op, left, right) {
    switch (op) {
        case "==": return left == right;
        case "===": return left === right;
        case "!=": return left != right;
        case "!==": return left !== right;
        case "<": return left < right;
        case "<=": return left <= right;
        case ">": return left > right;
        case ">=": return left >= right;
        case "+": return left + right;
        case "-": return left - right;
        case "*": return left * right;
        case "/": return left / right;
        case "%": return left % right;
        case "&&": return left && right;
        case "||": return left || right;
        default: return undefined;
    }
}
