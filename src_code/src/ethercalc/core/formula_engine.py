"""Formula evaluation engine for spreadsheet calculations."""

import math
import re
from datetime import datetime, date
from typing import Any, Dict, List, Optional, Set, Union, Callable
from decimal import Decimal, ROUND_HALF_UP

from ..utils.exceptions import FormulaError, CircularReferenceError


class FormulaEngine:
    """Handles formula parsing and evaluation."""
    
    def __init__(self):
        """Initialize formula engine with built-in functions."""
        self.functions = self._initialize_functions()
        self.operators = {
            '+': lambda a, b: self._to_number(a) + self._to_number(b),
            '-': lambda a, b: self._to_number(a) - self._to_number(b),
            '*': lambda a, b: self._to_number(a) * self._to_number(b),
            '/': lambda a, b: self._divide(a, b),
            '^': lambda a, b: self._to_number(a) ** self._to_number(b),
            '=': lambda a, b: a == b,
            '<': lambda a, b: self._compare(a, b, '<'),
            '>': lambda a, b: self._compare(a, b, '>'),
            '<=': lambda a, b: self._compare(a, b, '<='),
            '>=': lambda a, b: self._compare(a, b, '>='),
            '<>': lambda a, b: a != b,
            '&': lambda a, b: str(a) + str(b),
        }
        
    def evaluate_formula(self, formula: str, cell_getter: Callable[[str], Any], 
                        current_cell: str = None) -> Any:
        """
        Evaluate a formula string.
        
        Args:
            formula: The formula to evaluate (without leading =)
            cell_getter: Function to get cell values by reference
            current_cell: Current cell reference (for circular reference detection)
        
        Returns:
            The evaluated result
        """
        try:
            if not formula or not formula.strip():
                return ""
            
            # Remove leading = if present
            if formula.startswith('='):
                formula = formula[1:]
            
            # Parse and evaluate the formula
            result = self._parse_expression(formula, cell_getter, current_cell)
            return result
            
        except Exception as e:
            return f"#ERROR: {str(e)}"
    
    def _parse_expression(self, expr: str, cell_getter: Callable[[str], Any], 
                         current_cell: str = None) -> Any:
        """Parse and evaluate an expression."""
        expr = expr.strip()
        
        # Handle parentheses
        while '(' in expr:
            # Find innermost parentheses
            start = -1
            for i, char in enumerate(expr):
                if char == '(':
                    start = i
                elif char == ')':
                    if start == -1:
                        raise FormulaError("Mismatched parentheses")
                    inner_expr = expr[start + 1:i]
                    result = self._parse_expression(inner_expr, cell_getter, current_cell)
                    expr = expr[:start] + str(result) + expr[i + 1:]
                    break
            else:
                if start != -1:
                    raise FormulaError("Mismatched parentheses")
        
        # Handle operators (in order of precedence)
        return self._evaluate_operators(expr, cell_getter, current_cell)
    
    def _evaluate_operators(self, expr: str, cell_getter: Callable[[str], Any], 
                           current_cell: str = None) -> Any:
        """Evaluate operators in correct precedence order."""
        # Comparison operators (lowest precedence)
        for op in ['=', '<>', '<=', '>=', '<', '>']:
            if op in expr:
                parts = expr.split(op, 1)
                if len(parts) == 2:
                    left = self._parse_expression(parts[0].strip(), cell_getter, current_cell)
                    right = self._parse_expression(parts[1].strip(), cell_getter, current_cell)
                    return self.operators[op](left, right)
        
        # String concatenation
        if '&' in expr:
            parts = expr.split('&', 1)
            if len(parts) == 2:
                left = self._parse_expression(parts[0].strip(), cell_getter, current_cell)
                right = self._parse_expression(parts[1].strip(), cell_getter, current_cell)
                return self.operators['&'](left, right)
        
        # Addition and subtraction
        for op in ['+', '-']:
            # Find operator not inside quotes or function calls
            pos = self._find_operator(expr, op)
            if pos != -1:
                left = self._parse_expression(expr[:pos], cell_getter, current_cell)
                right = self._parse_expression(expr[pos + 1:], cell_getter, current_cell)
                return self.operators[op](left, right)
        
        # Multiplication and division
        for op in ['*', '/']:
            pos = self._find_operator(expr, op)
            if pos != -1:
                left = self._parse_expression(expr[:pos], cell_getter, current_cell)
                right = self._parse_expression(expr[pos + 1:], cell_getter, current_cell)
                return self.operators[op](left, right)
        
        # Exponentiation (highest precedence)
        pos = self._find_operator(expr, '^')
        if pos != -1:
            left = self._parse_expression(expr[:pos], cell_getter, current_cell)
            right = self._parse_expression(expr[pos + 1:], cell_getter, current_cell)
            return self.operators['^'](left, right)
        
        # No operators found, evaluate as atom
        return self._evaluate_atom(expr, cell_getter, current_cell)
    
    def _find_operator(self, expr: str, op: str) -> int:
        """Find operator position, ignoring those inside quotes or function calls."""
        paren_depth = 0
        in_quotes = False
        
        for i in range(len(expr) - len(op) + 1):
            if expr[i] == '"':
                in_quotes = not in_quotes
            elif not in_quotes:
                if expr[i] == '(':
                    paren_depth += 1
                elif expr[i] == ')':
                    paren_depth -= 1
                elif paren_depth == 0 and expr[i:i + len(op)] == op:
                    return i
        
        return -1
    
    def _evaluate_atom(self, atom: str, cell_getter: Callable[[str], Any], 
                      current_cell: str = None) -> Any:
        """Evaluate atomic expressions (literals, cell references, functions)."""
        atom = atom.strip()
        
        # Empty expression
        if not atom:
            return ""
        
        # String literal
        if atom.startswith('"') and atom.endswith('"'):
            return atom[1:-1]  # Remove quotes
        
        # Number literal
        try:
            if '.' in atom:
                return float(atom)
            else:
                return int(atom)
        except ValueError:
            pass
        
        # Boolean literal
        if atom.upper() == 'TRUE':
            return True
        elif atom.upper() == 'FALSE':
            return False
        
        # Function call
        if '(' in atom and atom.endswith(')'):
            return self._evaluate_function(atom, cell_getter, current_cell)
        
        # Cell reference
        if self._is_cell_reference(atom):
            return self._get_cell_value(atom, cell_getter, current_cell)
        
        # Range reference (for functions that accept ranges)
        if ':' in atom and self._is_range_reference(atom):
            return self._get_range_values(atom, cell_getter, current_cell)
        
        # If nothing else matches, treat as string
        return atom
    
    def _evaluate_function(self, func_call: str, cell_getter: Callable[[str], Any], 
                          current_cell: str = None) -> Any:
        """Evaluate function call."""
        # Parse function name and arguments
        paren_pos = func_call.find('(')
        func_name = func_call[:paren_pos].upper().strip()
        args_str = func_call[paren_pos + 1:-1]  # Remove parentheses
        
        # Parse arguments
        args = self._parse_function_args(args_str, cell_getter, current_cell)
        
        # Call function
        if func_name in self.functions:
            return self.functions[func_name](*args)
        else:
            raise FormulaError(f"Unknown function: {func_name}")
    
    def _parse_function_args(self, args_str: str, cell_getter: Callable[[str], Any], 
                            current_cell: str = None) -> List[Any]:
        """Parse function arguments."""
        if not args_str.strip():
            return []
        
        args = []
        current_arg = ""
        paren_depth = 0
        in_quotes = False
        
        for char in args_str:
            if char == '"':
                in_quotes = not in_quotes
                current_arg += char
            elif not in_quotes:
                if char == '(':
                    paren_depth += 1
                    current_arg += char
                elif char == ')':
                    paren_depth -= 1
                    current_arg += char
                elif char == ',' and paren_depth == 0:
                    # End of argument
                    args.append(self._parse_expression(current_arg.strip(), cell_getter, current_cell))
                    current_arg = ""
                else:
                    current_arg += char
            else:
                current_arg += char
        
        # Add last argument
        if current_arg.strip():
            args.append(self._parse_expression(current_arg.strip(), cell_getter, current_cell))
        
        return args
    
    def _is_cell_reference(self, ref: str) -> bool:
        """Check if string is a valid cell reference."""
        return bool(re.match(r'^[A-Z]+\d+$', ref.upper()))
    
    def _is_range_reference(self, ref: str) -> bool:
        """Check if string is a valid range reference."""
        if ':' not in ref:
            return False
        parts = ref.split(':')
        return len(parts) == 2 and all(self._is_cell_reference(part) for part in parts)
    
    def _get_cell_value(self, cell_ref: str, cell_getter: Callable[[str], Any], 
                       current_cell: str = None) -> Any:
        """Get value from cell reference."""
        if current_cell and cell_ref.upper() == current_cell.upper():
            raise CircularReferenceError(f"Circular reference detected: {cell_ref}")
        
        return cell_getter(cell_ref.upper())
    
    def _get_range_values(self, range_ref: str, cell_getter: Callable[[str], Any], 
                         current_cell: str = None) -> List[Any]:
        """Get values from range reference."""
        start_ref, end_ref = range_ref.split(':')
        start_col, start_row = self._parse_cell_ref(start_ref)
        end_col, end_row = self._parse_cell_ref(end_ref)
        
        values = []
        for row in range(start_row, end_row + 1):
            for col in range(start_col, end_col + 1):
                cell_ref = self._create_cell_ref(col, row)
                values.append(self._get_cell_value(cell_ref, cell_getter, current_cell))
        
        return values
    
    def _parse_cell_ref(self, cell_ref: str) -> tuple:
        """Parse cell reference to column and row indices."""
        col_str = ""
        row_str = ""
        
        for char in cell_ref.upper():
            if char.isalpha():
                col_str += char
            else:
                row_str += char
        
        # Convert column letters to number
        col = 0
        for char in col_str:
            col = col * 26 + (ord(char) - ord('A') + 1)
        col -= 1  # Convert to 0-based
        
        row = int(row_str) - 1  # Convert to 0-based
        
        return col, row
    
    def _create_cell_ref(self, col: int, row: int) -> str:
        """Create cell reference from column and row indices."""
        col_str = ""
        col += 1  # Convert to 1-based
        while col > 0:
            col -= 1
            col_str = chr(ord('A') + col % 26) + col_str
            col //= 26
        
        return f"{col_str}{row + 1}"
    
    def _to_number(self, value: Any) -> Union[int, float]:
        """Convert value to number."""
        if isinstance(value, (int, float)):
            return value
        elif isinstance(value, bool):
            return 1 if value else 0
        elif isinstance(value, str):
            try:
                if '.' in value:
                    return float(value)
                else:
                    return int(value)
            except ValueError:
                return 0
        else:
            return 0
    
    def _divide(self, a: Any, b: Any) -> Any:
        """Safe division with error handling."""
        num_a = self._to_number(a)
        num_b = self._to_number(b)
        
        if num_b == 0:
            return "#DIV/0!"
        
        return num_a / num_b
    
    def _compare(self, a: Any, b: Any, op: str) -> bool:
        """Compare two values."""
        if isinstance(a, str) and isinstance(b, str):
            if op == '<':
                return a < b
            elif op == '>':
                return a > b
            elif op == '<=':
                return a <= b
            elif op == '>=':
                return a >= b
        else:
            num_a = self._to_number(a)
            num_b = self._to_number(b)
            if op == '<':
                return num_a < num_b
            elif op == '>':
                return num_a > num_b
            elif op == '<=':
                return num_a <= num_b
            elif op == '>=':
                return num_a >= num_b
        
        return False
    
    def _initialize_functions(self) -> Dict[str, Callable]:
        """Initialize built-in spreadsheet functions."""
        return {
            # Math functions
            'SUM': lambda *args: sum(self._to_number(arg) for arg in self._flatten_args(args)),
            'AVERAGE': self._average,
            'MIN': lambda *args: min(self._to_number(arg) for arg in self._flatten_args(args)),
            'MAX': lambda *args: max(self._to_number(arg) for arg in self._flatten_args(args)),
            'COUNT': lambda *args: len([arg for arg in self._flatten_args(args) if isinstance(arg, (int, float))]),
            'COUNTA': lambda *args: len([arg for arg in self._flatten_args(args) if arg is not None and str(arg).strip() != ""]),
            'ROUND': lambda num, digits=0: round(self._to_number(num), int(self._to_number(digits))),
            'ABS': lambda num: abs(self._to_number(num)),
            'SQRT': lambda num: math.sqrt(self._to_number(num)),
            'POWER': lambda base, exp: self._to_number(base) ** self._to_number(exp),
            'MOD': lambda num, div: self._to_number(num) % self._to_number(div),
            'PI': lambda: math.pi,
            'EXP': lambda num: math.exp(self._to_number(num)),
            'LN': lambda num: math.log(self._to_number(num)),
            'LOG10': lambda num: math.log10(self._to_number(num)),
            'SIN': lambda num: math.sin(self._to_number(num)),
            'COS': lambda num: math.cos(self._to_number(num)),
            'TAN': lambda num: math.tan(self._to_number(num)),
            
            # Text functions
            'CONCATENATE': lambda *args: ''.join(str(arg) for arg in args),
            'LEFT': lambda text, num_chars: str(text)[:int(self._to_number(num_chars))],
            'RIGHT': lambda text, num_chars: str(text)[-int(self._to_number(num_chars)):],
            'MID': lambda text, start, num_chars: str(text)[int(self._to_number(start))-1:int(self._to_number(start))-1+int(self._to_number(num_chars))],
            'LEN': lambda text: len(str(text)),
            'UPPER': lambda text: str(text).upper(),
            'LOWER': lambda text: str(text).lower(),
            'TRIM': lambda text: str(text).strip(),
            'FIND': self._find_text,
            'SUBSTITUTE': self._substitute_text,
            
            # Logical functions
            'IF': self._if_function,
            'AND': lambda *args: all(bool(arg) for arg in args),
            'OR': lambda *args: any(bool(arg) for arg in args),
            'NOT': lambda value: not bool(value),
            
            # Date functions
            'TODAY': lambda: datetime.now().date(),
            'NOW': lambda: datetime.now(),
            'YEAR': lambda date_val: self._extract_date_part(date_val, 'year'),
            'MONTH': lambda date_val: self._extract_date_part(date_val, 'month'),
            'DAY': lambda date_val: self._extract_date_part(date_val, 'day'),
            'DATE': lambda year, month, day: date(int(self._to_number(year)), int(self._to_number(month)), int(self._to_number(day))),
            
            # Statistical functions
            'MEDIAN': self._median,
            'MODE': self._mode,
            'STDEV': self._stdev,
            'VAR': self._var,
        }
    
    def _flatten_args(self, args: tuple) -> List[Any]:
        """Flatten nested argument lists (for range arguments)."""
        result = []
        for arg in args:
            if isinstance(arg, list):
                result.extend(self._flatten_args(arg))
            else:
                result.append(arg)
        return result
    
    def _average(self, *args) -> float:
        """Calculate average of arguments."""
        flat_args = self._flatten_args(args)
        numeric_args = [self._to_number(arg) for arg in flat_args if isinstance(arg, (int, float)) or str(arg).replace('.', '').replace('-', '').isdigit()]
        
        if not numeric_args:
            return 0
        
        return sum(numeric_args) / len(numeric_args)
    
    def _if_function(self, condition: Any, true_value: Any, false_value: Any = "") -> Any:
        """IF function implementation."""
        return true_value if bool(condition) else false_value
    
    def _find_text(self, find_text: str, within_text: str, start_num: int = 1) -> int:
        """FIND function implementation."""
        start_pos = int(self._to_number(start_num)) - 1
        pos = str(within_text).find(str(find_text), start_pos)
        return pos + 1 if pos != -1 else -1
    
    def _substitute_text(self, text: str, old_text: str, new_text: str, instance_num: int = None) -> str:
        """SUBSTITUTE function implementation."""
        text_str = str(text)
        old_str = str(old_text)
        new_str = str(new_text)
        
        if instance_num is None:
            return text_str.replace(old_str, new_str)
        else:
            # Replace only the specified instance
            parts = text_str.split(old_str)
            instance = int(self._to_number(instance_num))
            if 1 <= instance < len(parts):
                parts[instance-1] = parts[instance-1] + new_str + parts[instance]
                del parts[instance]
                return old_str.join(parts)
            return text_str
    
    def _extract_date_part(self, date_val: Any, part: str) -> int:
        """Extract year, month, or day from date value."""
        if isinstance(date_val, (date, datetime)):
            if part == 'year':
                return date_val.year
            elif part == 'month':
                return date_val.month
            elif part == 'day':
                return date_val.day
        
        # Try to parse string as date
        try:
            if isinstance(date_val, str):
                parsed_date = datetime.strptime(date_val, '%Y-%m-%d').date()
                if part == 'year':
                    return parsed_date.year
                elif part == 'month':
                    return parsed_date.month
                elif part == 'day':
                    return parsed_date.day
        except ValueError:
            pass
        
        return 0
    
    def _median(self, *args) -> float:
        """Calculate median of arguments."""
        flat_args = self._flatten_args(args)
        numeric_args = sorted([self._to_number(arg) for arg in flat_args if isinstance(arg, (int, float))])
        
        if not numeric_args:
            return 0
        
        n = len(numeric_args)
        if n % 2 == 0:
            return (numeric_args[n//2 - 1] + numeric_args[n//2]) / 2
        else:
            return numeric_args[n//2]
    
    def _mode(self, *args) -> Any:
        """Calculate mode of arguments."""
        flat_args = self._flatten_args(args)
        
        if not flat_args:
            return 0
        
        # Count occurrences
        counts = {}
        for arg in flat_args:
            counts[arg] = counts.get(arg, 0) + 1
        
        # Find most frequent
        max_count = max(counts.values())
        modes = [k for k, v in counts.items() if v == max_count]
        
        return modes[0] if modes else 0
    
    def _stdev(self, *args) -> float:
        """Calculate standard deviation."""
        flat_args = self._flatten_args(args)
        numeric_args = [self._to_number(arg) for arg in flat_args if isinstance(arg, (int, float))]
        
        if len(numeric_args) < 2:
            return 0
        
        mean = sum(numeric_args) / len(numeric_args)
        variance = sum((x - mean) ** 2 for x in numeric_args) / (len(numeric_args) - 1)
        
        return math.sqrt(variance)
    
    def _var(self, *args) -> float:
        """Calculate variance."""
        flat_args = self._flatten_args(args)
        numeric_args = [self._to_number(arg) for arg in flat_args if isinstance(arg, (int, float))]
        
        if len(numeric_args) < 2:
            return 0
        
        mean = sum(numeric_args) / len(numeric_args)
        variance = sum((x - mean) ** 2 for x in numeric_args) / (len(numeric_args) - 1)
        
        return variance