import { render } from '@testing-library/react-native';
import React from 'react';
import { Profile } from '../../screens/Profile';

describe('Profile Screen', () => {
  it('should have placeholder correctly in user name input', () => {
    const { getByPlaceholderText } = render(<Profile />);

    const inputName = getByPlaceholderText('Nome');
    //   console.log(inputName.props.placeholder);
    expect(inputName).toBeTruthy();
  });

  it('should be load user data', () => {
    const { getByTestId } = render(<Profile />);

    const inputName = getByTestId('input-name');
    const inputSurName = getByTestId('input-surname');

    expect(inputName.props.value).toEqual('Rodrigo');
    expect(inputSurName.props.value).toEqual('Passador');
  });

  it('should exist title correctly', () => {
    const { getByTestId } = render(<Profile />);

    const textTitle = getByTestId('text-title');

    expect(textTitle.props.children).toContain('Perfil');
  });
});
